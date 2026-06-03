const logger = require('../config/logger');
const githubService = require('../services/githubService');
const diffAnalyzer = require('../services/diffAnalyzer');
const aiService = require('../services/aiService');
const commentService = require('../services/commentService');
const repoSettingsService = require('../services/repoSettingsService');
const rulesEngine = require('../services/rulesEngine');
const reviewRunService = require('../services/reviewRunService');
const reviewInsights = require('../services/reviewInsights');
const userService = require('../services/userService');

async function processPullRequestEvent(payload, event) {
  let runContext = null;
  const totalStart = Date.now();
  const maxDiffChars = Number(process.env.WEBHOOK_MAX_DIFF_CHARS || 400000);
  const maxHunks = Number(process.env.WEBHOOK_MAX_HUNKS || 400);

  try {
    if (event !== 'pull_request') {
      return;
    }

    const action = payload.action;
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return;
    }

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.number;
    const headSha = payload.pull_request?.head?.sha || 'unknown-sha';
    const prTitle = payload.pull_request?.title || '';
    const prAuthor = payload.pull_request?.user?.login || '';
    const parsedPrOpenedAt = payload.pull_request?.created_at
      ? new Date(payload.pull_request.created_at)
      : null;
    const prOpenedAt = parsedPrOpenedAt && !Number.isNaN(parsedPrOpenedAt.getTime())
      ? parsedPrOpenedAt
      : null;

    runContext = { owner, repo, prNumber, headSha };

    logger.info(`Processing PR ${owner}/${repo}#${prNumber}: ${prTitle} by ${prAuthor}`);

    const installationId = payload.installation?.id || null;
    const teamSettings = await repoSettingsService.getOrCreateRepoSettings({ owner, repo });

    if (installationId && installationId !== teamSettings.installationId) {
      await repoSettingsService.updateRepoSettings({
        owner,
        repo,
        update: { installationId },
      });
      teamSettings.installationId = installationId;
    }

    if (teamSettings.enabled === false) {
      logger.info(`Repo disabled. Skipping PR ${owner}/${repo}#${prNumber}`);
      await reviewRunService.skipRun({ owner, repo, prNumber, headSha, reason: 'repo_disabled' });
      return;
    }

    const effectiveInstallationId = installationId || teamSettings.installationId;
    let accessToken = null;

    if (!effectiveInstallationId) {
      if (teamSettings.githubUserId) {
        accessToken = await userService.getGithubAccessToken(teamSettings.githubUserId);
      }

      if (!accessToken) {
        await reviewRunService.failRun({
          owner,
          repo,
          prNumber,
          headSha,
          errorMessage: 'github_auth_missing',
          timingsMs: { total: 0 },
        }).catch(() => null);
        return;
      }
    }

    if (teamSettings.rules.enableReplayGuard) {
      const alreadyProcessed = await reviewRunService.hasProcessedHeadSha({ owner, repo, prNumber, headSha });
      if (alreadyProcessed) {
        await reviewRunService.skipRun({ owner, repo, prNumber, headSha, reason: 'duplicate_head_sha' });
        return;
      }
    }

    const runRecord = await reviewRunService.startRun({
      owner,
      repo,
      prNumber,
      action,
      headSha,
      prTitle,
      prAuthor,
      prOpenedAt,
    });

    const fetchDiffStart = Date.now();
    const rawDiff = await githubService.fetchPullRequestDiff({
      owner,
      repo,
      pull_number: prNumber,
      installationId: effectiveInstallationId,
      accessToken,
    });
    const fetchDiffMs = Date.now() - fetchDiffStart;

    if (Number.isFinite(maxDiffChars) && maxDiffChars > 0 && rawDiff.length > maxDiffChars) {
      await reviewRunService.failRun({
        owner,
        repo,
        prNumber,
        headSha,
        errorMessage: 'diff_too_large',
        timingsMs: { total: Date.now() - totalStart },
      }).catch(() => null);
      logger.warn(`Diff too large for ${owner}/${repo}#${prNumber} (${rawDiff.length} chars)`);
      return;
    }

    const diffs = diffAnalyzer.extractChangedHunks(rawDiff);
    const totalHunks = diffs.reduce((acc, file) => acc + (file.hunks?.length || 0), 0);
    if (Number.isFinite(maxHunks) && maxHunks > 0 && totalHunks > maxHunks) {
      await reviewRunService.failRun({
        owner,
        repo,
        prNumber,
        headSha,
        errorMessage: 'hunks_too_many',
        timingsMs: { total: Date.now() - totalStart },
      }).catch(() => null);
      logger.warn(`Too many hunks for ${owner}/${repo}#${prNumber} (${totalHunks} hunks)`);
      return;
    }

    const commentsToPost = [];
    const findings = [];
    const seenFingerprints = new Set();
    const llmStart = Date.now();
    const maxHunksPerRun = rulesEngine.getMaxHunksPerPR(teamSettings);
    const maxComments = rulesEngine.getMaxCommentsPerPR(teamSettings);
    let analyzedHunks = 0;

    for (const file of diffs) {
      if (!rulesEngine.shouldAnalyzeFile(file.filename, teamSettings)) {
        continue;
      }

      for (const hunk of file.hunks) {
        if (analyzedHunks >= maxHunksPerRun || commentsToPost.length >= maxComments) {
          break;
        }

        if (!rulesEngine.shouldAnalyzeHunk(hunk, teamSettings)) {
          continue;
        }

        analyzedHunks += 1;

        const analysis = await aiService.analyzeHunk({
          filePath: file.filename,
          hunk,
          repo,
          owner,
          teamSettings,
          rulesContext: rulesEngine.buildAiRuleContext(teamSettings),
        });

        if (rulesEngine.shouldKeepSuggestion(analysis, teamSettings)) {
          const severity = analysis.severity || 'medium';
          const category = analysis.category || 'correctness';
          const confidence = Number.isFinite(analysis.confidence) ? analysis.confidence : 0.65;
          const riskScore = reviewInsights.computeRiskScore({
            filePath: file.filename,
            severity,
            category,
            changedLines: hunk.changedLines,
          });
          const fingerprint = reviewInsights.buildFindingFingerprint({
            owner,
            repo,
            prNumber,
            filePath: file.filename,
            title: analysis.title,
            suggestion: analysis.suggestion,
          });

          if (seenFingerprints.has(fingerprint)) {
            continue;
          }
          seenFingerprints.add(fingerprint);

          const finding = {
            filePath: file.filename,
            severity,
            category,
            confidence,
            title: analysis.title || `${severity.toUpperCase()} issue in ${file.filename}`,
            explanation: analysis.explanation || '',
            suggestion: analysis.suggestion,
            riskScore,
            fingerprint,
            blastRadius: reviewInsights.classifyBlastRadius({ filePath: file.filename, changedLines: hunk.changedLines }),
          };
          findings.push(finding);

          commentsToPost.push({
            path: file.filename,
            hunk,
            suggestion: analysis.suggestion,
            explanation: analysis.explanation,
            severity,
            category,
            confidence,
            riskScore,
            blastRadius: finding.blastRadius,
            title: finding.title,
          });
        }
      }

      if (analyzedHunks >= maxHunksPerRun || commentsToPost.length >= maxComments) {
        break;
      }
    }

    const llmCompletedAt = new Date();
    const llmAnalysisMs = llmCompletedAt.getTime() - llmStart;
    const prOpenToLlmResponseMs = prOpenedAt
      ? Math.max(0, llmCompletedAt.getTime() - prOpenedAt.getTime())
      : 0;
    logger.info(
      `PR open to LLM response for ${owner}/${repo}#${prNumber}: ${prOpenToLlmResponseMs}ms`,
    );
    const commentStart = Date.now();

    let reviewId = runRecord?.reviewId || null;
    let commentsPosted = 0;

    if (commentsToPost.length > 0 && !reviewId) {
      reviewId = await commentService.postComments({
        owner,
        repo,
        pull_number: prNumber,
        installationId: effectiveInstallationId,
        accessToken,
        comments: commentsToPost,
      });
      commentsPosted = reviewId ? commentsToPost.length : 0;

      if (reviewId) {
        await reviewRunService.setReviewId({ owner, repo, prNumber, headSha, reviewId });
      }
    } else if (reviewId) {
      logger.info(`Review already posted for ${owner}/${repo}#${prNumber}; skipping duplicate comment.`);
    }

    const commentPostMs = Date.now() - commentStart;
    const totalMs = Date.now() - totalStart;
    const summary = reviewInsights.summarizeRun(findings);

    await reviewRunService.completeRun({
      owner,
      repo,
      prNumber,
      headSha,
      payload: {
        timingsMs: {
          prOpenToLlmResponse: prOpenToLlmResponseMs,
          fetchDiff: fetchDiffMs,
          llmAnalysis: llmAnalysisMs,
          commentPost: commentPostMs,
          total: totalMs,
        },
        llmCompletedAt,
        filesChanged: diffs.length,
        hunksAnalyzed: analyzedHunks,
        commentsPosted,
        reviewId,
        avgRiskScore: summary.avgRiskScore,
        findings,
      },
    });
  } catch (err) {
    if (runContext?.owner && runContext?.repo && runContext?.prNumber && runContext?.headSha) {
      await reviewRunService.failRun({
        owner: runContext.owner,
        repo: runContext.repo,
        prNumber: runContext.prNumber,
        headSha: runContext.headSha,
        errorMessage: err.message || 'unknown_error',
        timingsMs: { total: 0 },
      }).catch(() => null);
    }
    logger.error('Webhook processing failed', err.message || err);
  }
}

module.exports = { processPullRequestEvent };
