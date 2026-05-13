const githubService = require('./githubService');
const logger = require('../config/logger');

function estimatePositionFromHunk(hunk) {
  // Use newStart as an anchor; GitHub API expects a line number in the file's new version
  return hunk.newStart || 1;
}

function formatIssues(explanation) {
  if (!explanation) {
    return '- No additional context provided.';
  }

  const trimmed = String(explanation).trim();
  if (!trimmed) {
    return '- No additional context provided.';
  }

  if (/^\s*[-*]\s+/m.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\r?\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `- ${line}`)
    .join('\n');
}

function formatFixSuggestions(suggestion) {
  if (!suggestion) {
    return '_No fix suggestion provided._';
  }

  const trimmed = String(suggestion).trim();
  if (!trimmed) {
    return '_No fix suggestion provided._';
  }

  if (trimmed.includes('```')) {
    return trimmed;
  }

  return [
    '```',
    trimmed,
    '```',
  ].join('\n');
}

async function postComments({ owner, repo, pull_number, comments }) {
  // Build review comments array for octokit
  const reviewComments = comments.map(c => {
    const line = estimatePositionFromHunk(c.hunk);
    const issuesSection = formatIssues(c.explanation);
    const fixesSection = formatFixSuggestions(c.suggestion);
    const body = [
      `### ${c.title || 'Suggested Fix'}`,
      `- Severity: **${c.severity || 'medium'}**`,
      `- Category: **${c.category || 'correctness'}**`,
      `- Confidence: **${Math.round((c.confidence || 0.65) * 100)}%**`,
      `- Risk Score: **${c.riskScore || 0}/100**`,
      `- Blast Radius: **${c.blastRadius || 'low'}**`,
      '',
      '#### Issues',
      issuesSection,
      '',
      '#### Fix Suggestions',
      fixesSection,
      '',
      '#### Markdown Formatting',
      'This review uses Markdown headings, bullet lists, and code fences for clarity.',
    ].join('\n');
    return { path: c.path, line, body };
  });

  // Post a single review with aggregated comments
  try {
    const summary = buildReviewSummary(comments);
    await githubService.createReview({ owner, repo, pull_number, event: 'COMMENT', body: summary, comments: reviewComments });
    logger.info(`Posted ${reviewComments.length} comments to ${owner}/${repo}#${pull_number}`);
  } catch (err) {
    logger.error('Failed to post review', err.message || err);
    throw err;
  }
}

function buildReviewSummary(comments) {
  const bySeverity = comments.reduce(
    (acc, c) => {
      acc[c.severity || 'medium'] = (acc[c.severity || 'medium'] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 }
  );

  return [
    '## GitGuard AI Review Summary',
    '',
    `- Findings: **${comments.length}**`,
    `- Critical: **${bySeverity.critical || 0}**`,
    `- High: **${bySeverity.high || 0}**`,
    `- Medium: **${bySeverity.medium || 0}**`,
    `- Low: **${bySeverity.low || 0}**`,
    '',
    'Comments below are diff-only and include fix-first suggestions.',
  ].join('\n');
}

module.exports = { postComments };
