const logger = require('../config/logger');
const githubService = require('../services/githubService');
const diffAnalyzer = require('../services/diffAnalyzer');
const aiService = require('../services/aiService');
const commentService = require('../services/commentService');
const repoSettingsService = require('../services/repoSettingsService');
const rulesEngine = require('../services/rulesEngine');
const reviewRunService = require('../services/reviewRunService');
const reviewInsights = require('../services/reviewInsights');

async function handleGithubWebhook(req, res, next) {
  let runContext = null;
  try {
    const totalStart = Date.now();
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event !== 'pull_request') {
      return res.status(200).send({ ok: true, message: 'ignored event' });
    }

    const action = payload.action;
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return res.status(200).send({ ok: true, message: 'no-op for action' });
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

    const teamSettings = await repoSettingsService.getOrCreateRepoSettings({ owner, repo });

    if (teamSettings.rules.enableReplayGuard) {
      const alreadyProcessed = await reviewRunService.hasProcessedHeadSha({ owner, repo, prNumber, headSha });
      if (alreadyProcessed) {
        await reviewRunService.skipRun({ owner, repo, prNumber, headSha, reason: 'duplicate_head_sha' });
        return res.status(200).json({ ok: true, message: 'skipped duplicate head sha' });
      }
    }

    await reviewRunService.startRun({ owner, repo, prNumber, action, headSha, prTitle, prAuthor, prOpenedAt });

    const fetchDiffStart = Date.now();
    const rawDiff = await githubService.fetchPullRequestDiff({ owner, repo, pull_number: prNumber });
    const fetchDiffMs = Date.now() - fetchDiffStart;

    const diffs = diffAnalyzer.extractChangedHunks(rawDiff);

    const commentsToPost = [];
    const findings = [];
    const seenFingerprints = new Set();
    const llmStart = Date.now();
    const maxHunks = rulesEngine.getMaxHunksPerPR(teamSettings);
    const maxComments = rulesEngine.getMaxCommentsPerPR(teamSettings);
    let analyzedHunks = 0;

    for (const file of diffs) {
      if (!rulesEngine.shouldAnalyzeFile(file.filename, teamSettings)) {
        continue;
      }

      for (const hunk of file.hunks) {
        if (analyzedHunks >= maxHunks || commentsToPost.length >= maxComments) {
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

      if (analyzedHunks >= maxHunks || commentsToPost.length >= maxComments) {
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

    if (commentsToPost.length > 0) {
      await commentService.postComments({ owner, repo, pull_number: prNumber, comments: commentsToPost });
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
        commentsPosted: commentsToPost.length,
        avgRiskScore: summary.avgRiskScore,
        findings,
      },
    });

    res.status(200).json({
      ok: true,
      comments: commentsToPost.length,
      metrics: {
        filesChanged: diffs.length,
        hunksAnalyzed: analyzedHunks,
        avgRiskScore: summary.avgRiskScore,
        timingsMs: {
          prOpenToLlmResponse: prOpenToLlmResponseMs,
          fetchDiff: fetchDiffMs,
          llmAnalysis: llmAnalysisMs,
          commentPost: commentPostMs,
          total: totalMs,
        },
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
    next(err);
  }
}

module.exports = { handleGithubWebhook };
