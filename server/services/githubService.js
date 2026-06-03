const logger = require('../config/logger');
const { getGitHubClient } = require('./githubAuth');
const { retryAsync } = require('./retry');

function applyRateLimitDelay(err) {
  const headers = err?.response?.headers || {};
  const reset = headers['x-ratelimit-reset'];
  if (reset) {
    const resetMs = Number(reset) * 1000;
    if (Number.isFinite(resetMs)) {
      const delayMs = Math.max(0, resetMs - Date.now()) + 1000;
      err.retryAfterMs = delayMs;
    }
  }
  return err;
}

async function withRateLimitHandling(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.status === 403 || err?.status === 429) {
      throw applyRateLimitDelay(err);
    }
    throw err;
  }
}

async function getOctokit({ installationId, accessToken }) {
  if (accessToken) {
    const { Octokit } = require('@octokit/rest');
    return new Octokit({ auth: accessToken });
  }
  return getGitHubClient({ installationId });
}

async function fetchPullRequestDiff({ owner, repo, pull_number, installationId, accessToken }) {
  const octokit = await getOctokit({ installationId, accessToken });
  const res = await retryAsync(
    () => withRateLimitHandling(() => octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number,
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
    })),
    {
      retries: 3,
      minDelayMs: 400,
      maxDelayMs: 2500,
      onRetry: ({ attempt, delayMs, error }) => {
        logger.warn(`Retrying diff fetch (${attempt + 1}/4) in ${delayMs}ms: ${error.message || error}`);
      },
    }
  );

  const diff = typeof res.data === 'string' ? res.data : String(res.data || '');
  logger.info(`Fetched raw diff (${diff.length} chars) for PR ${owner}/${repo}#${pull_number}`);
  return diff;
}

async function createReview({ owner, repo, pull_number, installationId, accessToken, event = 'COMMENT', body = '', comments = [] }) {
  const octokit = await getOctokit({ installationId, accessToken });
  const resp = await retryAsync(
    () => withRateLimitHandling(() => octokit.pulls.createReview({ owner, repo, pull_number, event, body, comments })),
    {
      retries: 3,
      minDelayMs: 400,
      maxDelayMs: 2500,
      onRetry: ({ attempt, delayMs, error }) => {
        logger.warn(`Retrying createReview (${attempt + 1}/4) in ${delayMs}ms: ${error.message || error}`);
      },
    }
  );
  return resp.data;
}

async function listOpenPullRequests({ owner, repo, installationId, accessToken, state = 'open' }) {
  const octokit = await getOctokit({ installationId, accessToken });
  const res = await retryAsync(
    () => withRateLimitHandling(() => octokit.pulls.list({
      owner,
      repo,
      state,
      per_page: 30,
      sort: 'updated',
      direction: 'desc',
    })),
    {
      retries: 3,
      minDelayMs: 400,
      maxDelayMs: 2500,
      onRetry: ({ attempt, delayMs, error }) => {
        logger.warn(`Retrying list pulls (${attempt + 1}/4) in ${delayMs}ms: ${error.message || error}`);
      },
    }
  );

  return res.data || [];
}

async function getPullRequest({ owner, repo, pull_number, installationId, accessToken }) {
  const octokit = await getOctokit({ installationId, accessToken });
  const res = await retryAsync(
    () => withRateLimitHandling(() => octokit.pulls.get({ owner, repo, pull_number })),
    {
      retries: 3,
      minDelayMs: 400,
      maxDelayMs: 2500,
      onRetry: ({ attempt, delayMs, error }) => {
        logger.warn(`Retrying get PR (${attempt + 1}/4) in ${delayMs}ms: ${error.message || error}`);
      },
    }
  );

  return res.data;
}

module.exports = { fetchPullRequestDiff, createReview, listOpenPullRequests, getPullRequest };
