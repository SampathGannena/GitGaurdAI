const { Octokit } = require('@octokit/rest');
const logger = require('../config/logger');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function listPullRequestFiles({ owner, repo, pull_number }) {
  const per_page = 100;
  let page = 1;
  const files = [];

  while (true) {
    const res = await octokit.pulls.listFiles({ owner, repo, pull_number, per_page, page });
    files.push(...res.data);
    if (res.data.length < per_page) break;
    page += 1;
  }

  logger.info(`Fetched ${files.length} files for PR ${owner}/${repo}#${pull_number}`);
  return files.map(f => ({ filename: f.filename, patch: f.patch }));
}

async function createReview({ owner, repo, pull_number, event = 'COMMENT', body = '', comments = [] }) {
  const resp = await octokit.pulls.createReview({ owner, repo, pull_number, event, body, comments });
  return resp.data;
}

module.exports = { listPullRequestFiles, createReview };
