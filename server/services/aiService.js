const axios = require('axios');
const logger = require('../config/logger');
const { retryAsync } = require('./retry');

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEPRECATED_GROQ_MODELS = new Set(['mixtral-8x7b-32768']);

async function analyzeHunk({ filePath, hunk, owner, repo, teamSettings = {}, rulesContext = {} }) {
  const prompt = `You are GitGuard AI reviewing ${owner}/${repo}.

Find bugs/security flaws in this added code.

Return ONLY valid JSON with keys:
- title: string (short issue headline)
- severity: one of low|medium|high|critical
- category: one of security|performance|correctness|maintainability
- confidence: number between 0 and 1
- suggestion: string (must contain corrected code in a fenced block)
- explanation: string (Markdown bullet list of issue(s))

Rules:
- Prioritize fix-first output.
- ${rulesContext.strictInstruction || 'Focus on practical issues.'}
- ${rulesContext.securityInstruction || 'Include security guidance only when relevant.'}
- Explanation tone: ${rulesContext.tone || 'human'}.
- Always format explanation as Markdown bullets (each line starts with "- ").
- Always format suggestion as a fenced code block with the corrected code.

Repo settings snapshot: ${JSON.stringify(teamSettings)}

Changed file: ${filePath}
Hunk header: ${hunk.header}
Added code:
${hunk.changedLines.join('\n') || '(no added code)'}

Diff context:
${hunk.patchLines.join('\n')}`;

  try {
    const res = await retryAsync(
      () => axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: getGroqModel(),
          messages: [
            { role: 'system', content: 'You are a helpful code reviewer.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 800
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 20000,
        }
      ),
      {
        retries: 2,
        minDelayMs: 500,
        maxDelayMs: 3000,
        onRetry: ({ attempt, delayMs, error }) => {
          logger.warn(`Retrying Groq analysis (${attempt + 1}/3) in ${delayMs}ms: ${error.message || error}`);
        },
      }
    );

    const text = res.data.choices?.[0]?.message?.content || '';
    const parsed = safeJsonParse(text);
    if (parsed) {
      return normalize(parsed);
    }

    return normalize({ suggestion: text, explanation: '' });
  } catch (err) {
    logger.error('Groq AI analysis error', err.message || err);
    return null;
  }
}

async function answerRepoQuestion({ owner, repo, prNumber, question, run, teamSettings = {}, recentRuns = [] }) {
  const runContext = run
    ? {
        prNumber: run.prNumber,
        title: run.prTitle,
        author: run.prAuthor,
        status: run.status,
        failureReason: run.skippedReason,
        filesChanged: run.filesChanged,
        hunksAnalyzed: run.hunksAnalyzed,
        commentsPosted: run.commentsPosted,
        avgRiskScore: run.avgRiskScore,
        timingsMs: run.timingsMs,
        findings: (run.findings || []).slice(0, 12).map((finding) => ({
          filePath: finding.filePath,
          severity: finding.severity,
          category: finding.category,
          title: finding.title,
          explanation: finding.explanation,
          suggestion: finding.suggestion,
          riskScore: finding.riskScore,
          blastRadius: finding.blastRadius,
        })),
      }
    : null;

  const prompt = `You are GitGuard AI Assistance for the connected repository ${owner}/${repo}.

Answer the user's PR review question using only the repository context below. Be concise, practical, and action-oriented.
If the selected PR has a failed run, explain the failure reason plainly and suggest what to do next.
If the run completed but hunk analysis is 0, say clearly that the review did not inspect the patch and do not imply code errors.
If there are findings, prioritize the riskiest findings and mention file paths.
If context is missing, say exactly what context is missing and what the user should load or scan.

Connected repository: ${owner}/${repo}
Selected PR: #${prNumber}
Repository rules/settings: ${JSON.stringify(teamSettings)}
Selected PR review run: ${JSON.stringify(runContext)}
Recent repository runs: ${JSON.stringify(
    recentRuns.slice(0, 8).map((item) => ({
      prNumber: item.prNumber,
      title: item.prTitle,
      status: item.status,
      failureReason: item.skippedReason,
      findings: item.findings?.length || 0,
      commentsPosted: item.commentsPosted || 0,
      avgRiskScore: item.avgRiskScore || 0,
      updatedAt: item.updatedAt,
    })),
  )}

User question:
${question}`;

  if (!process.env.GROQ_API_KEY) {
    return buildOfflineRepoAnswer({ owner, repo, prNumber, question, run });
  }

  try {
    const res = await retryAsync(
      () => axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: getGroqModel(),
          messages: [
            { role: 'system', content: 'You are GitGuard AI Assistance, a concise repository-aware PR review helper.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.25,
          max_tokens: 700,
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 20000,
        },
      ),
      {
        retries: 2,
        minDelayMs: 500,
        maxDelayMs: 3000,
        onRetry: ({ attempt, delayMs, error }) => {
          logger.warn(`Retrying Groq assistance (${attempt + 1}/3) in ${delayMs}ms: ${error.message || error}`);
        },
      },
    );

    const text = res.data.choices?.[0]?.message?.content || '';
    return text.trim() || buildOfflineRepoAnswer({ owner, repo, prNumber, question, run });
  } catch (err) {
    logger.error('Groq AI assistance error', err.message || err);
    return buildOfflineRepoAnswer({ owner, repo, prNumber, question, run });
  }
}

function buildOfflineRepoAnswer({ owner, repo, prNumber, run }) {
  if (!run) {
    return `I do not have review-run context for ${owner}/${repo} PR #${prNumber} yet. Run an AI scan for this PR first, then ask again for findings, risk, or next steps.`;
  }

  if (run.status === 'failed') {
    return `PR #${prNumber} has a failed analysis run. Reason: ${run.skippedReason || 'unknown failure'}. Try reducing the PR diff size, excluding generated files, or rerunning the scan after the repository context is available.`;
  }

  const findings = run.findings || [];
  if (!findings.length) {
    if ((run.hunksAnalyzed || 0) === 0) {
      return `PR #${prNumber} looks clean, but the review did not inspect the patch. The run completed with 0 hunks analyzed, so there is no diff coverage to confirm whether the changed files were actually reviewed. Run a fresh scan on the PR diff to collect review findings.`;
    }

    return `PR #${prNumber} in ${owner}/${repo} has status "${run.status}" and no stored findings. The scan completed, but there are no review findings to report. Focus on changed high-risk files, test coverage, and whether the scan covered the relevant code before merging.`;
  }

  const topFindings = findings
    .slice()
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
    .slice(0, 3)
    .map((finding) => `- ${finding.severity || 'medium'} in ${finding.filePath}: ${finding.title || 'Review finding'}`)
    .join('\n');

  return `For ${owner}/${repo} PR #${prNumber}, prioritize these findings:\n${topFindings}\n\nReview the suggestions, verify tests around the touched files, and rerun the scan after fixes.`;
}

function getGroqModel() {
  const configuredModel = process.env.GROQ_MODEL;
  if (!configuredModel || DEPRECATED_GROQ_MODELS.has(configuredModel)) {
    return DEFAULT_GROQ_MODEL;
  }
  return configuredModel;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const fenced = text.match(/```json\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch (innerErr) {
        return null;
      }
    }
    const genericObject = text.match(/\{[\s\S]*\}/);
    if (genericObject?.[0]) {
      try {
        return JSON.parse(genericObject[0]);
      } catch (innerErr) {
        return null;
      }
    }
    return null;
  }
}

function normalize(raw) {
  const confidence = Number(raw.confidence);
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    severity: normalizeSeverity(raw.severity),
    category: normalizeCategory(raw.category),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.65,
    suggestion: typeof raw.suggestion === 'string' ? raw.suggestion : '',
    explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
  };
}

function normalizeSeverity(severity) {
  const val = String(severity || '').toLowerCase();
  return ['low', 'medium', 'high', 'critical'].includes(val) ? val : 'medium';
}

function normalizeCategory(category) {
  const val = String(category || '').toLowerCase();
  return ['security', 'performance', 'correctness', 'maintainability'].includes(val) ? val : 'correctness';
}

module.exports = { analyzeHunk, answerRepoQuestion, getGroqModel };
