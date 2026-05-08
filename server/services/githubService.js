const { Octokit } = require('@octokit/rest');
const logger = require('../config/logger');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function fetchPullRequestDiff({ owner, repo, pull_number }) {
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

async function createReview({ owner, repo, pull_number, event = 'COMMENT', body = '', comments = [] }) {
  const resp = await octokit.pulls.createReview({ owner, repo, pull_number, event, body, comments });
  return resp.data;
}

module.exports = { fetchPullRequestDiff, createReview };
