const logger = require('../config/logger');
const { getGitHubClient } = require('./githubAuth');

async function getOctokit({ installationId, accessToken }) {
  if (accessToken) {
    const { Octokit } = require('@octokit/rest');
    return new Octokit({ auth: accessToken });
  }
  return getGitHubClient({ installationId });
}

async function fetchPullRequestDiff({ owner, repo, pull_number, installationId, accessToken }) {
  const octokit = await getOctokit({ installationId, accessToken });
  const res = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner,
    repo,
    pull_number,
    headers: {
      accept: 'application/vnd.github.v3.diff',
    },
  });

  const diff = typeof res.data === 'string' ? res.data : String(res.data || '');
  logger.info(`Fetched raw diff (${diff.length} chars) for PR ${owner}/${repo}#${pull_number}`);
  return diff;
}

async function createReview({ owner, repo, pull_number, installationId, accessToken, event = 'COMMENT', body = '', comments = [] }) {
  const octokit = await getOctokit({ installationId, accessToken });
  const resp = await octokit.pulls.createReview({ owner, repo, pull_number, event, body, comments });
  return resp.data;
}

module.exports = { fetchPullRequestDiff, createReview };
