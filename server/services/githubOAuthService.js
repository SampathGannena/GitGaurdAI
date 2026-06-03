const axios = require('axios');

function getOAuthConfig() {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_OAUTH_CALLBACK_URL;
  const scopes = process.env.GITHUB_OAUTH_SCOPES || 'repo';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('github_oauth_not_configured');
  }

  return { clientId, clientSecret, redirectUri, scopes };
}

function buildAuthorizeUrl({ state }) {
  const { clientId, redirectUri, scopes } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    prompt: 'login',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForToken({ code, state }) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const res = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      state,
    },
    { headers: { Accept: 'application/json' } }
  );

  if (!res.data?.access_token) {
    const err = new Error('oauth_exchange_failed');
    err.details = res.data;
    throw err;
  }

  return res.data.access_token;
}

async function fetchGitHubUser(accessToken) {
  const res = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  return res.data;
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchGitHubUser,
};
