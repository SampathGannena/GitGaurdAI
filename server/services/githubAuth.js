const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const logger = require('../config/logger');

const tokenCache = new Map();
let appAuth = null;

function hasAppConfig() {
  return Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
}

function getAppAuth() {
  if (appAuth) return appAuth;

  if (!hasAppConfig()) {
    return null;
  }

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  appAuth = createAppAuth({
    appId,
    privateKey,
  });

  return appAuth;
}

async function getInstallationToken(installationId) {
  if (!installationId) {
    throw new Error('installation_id_missing');
  }

  const cached = tokenCache.get(installationId);
  if (cached && cached.expiresAt > Date.now() + 60 * 1000) {
    return cached.token;
  }

  const auth = getAppAuth();
  if (!auth) {
    throw new Error('github_app_not_configured');
  }

  const authResult = await auth({
    type: 'installation',
    installationId,
  });

  const expiresAt = new Date(authResult.expiresAt).getTime();
  tokenCache.set(installationId, { token: authResult.token, expiresAt });
  return authResult.token;
}

async function getOctokitClient({ installationId } = {}) {
  const token = await getInstallationToken(installationId);
  return new Octokit({ auth: token });
}

function getFallbackOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('github_token_missing');
  }
  logger.warn('Using GITHUB_TOKEN fallback; configure GitHub App for production.');
  return new Octokit({ auth: token });
}

async function getGitHubClient({ installationId } = {}) {
  if (hasAppConfig()) {
    return getOctokitClient({ installationId });
  }

  return getFallbackOctokit();
}

module.exports = {
  getGitHubClient,
};
