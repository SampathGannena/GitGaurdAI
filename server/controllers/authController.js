const User = require('../models/User');
const authService = require('../services/authService');
const githubOAuthService = require('../services/githubOAuthService');
const repoSettingsService = require('../services/repoSettingsService');
const userService = require('../services/userService');
const crypto = require('crypto');

function sanitizeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}

async function register(req, res, next) {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (name.length < 2) {
      return res.status(400).json({ ok: false, error: 'invalid_name', message: 'Name must be at least 2 characters' });
    }
    if (!email.includes('@') || email.length < 5) {
      return res.status(400).json({ ok: false, error: 'invalid_email', message: 'Valid email is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: 'invalid_password', message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ ok: false, error: 'email_in_use', message: 'Email already registered' });
    }

    const created = await User.create({
      name,
      email,
      passwordHash: authService.hashPassword(password),
    });

    const token = authService.issueAuthToken(created);
    return res.status(201).json({ ok: true, token, user: sanitizeUser(created) });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'missing_credentials', message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !authService.verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'invalid_credentials', message: 'Invalid email or password' });
    }

    const token = authService.issueAuthToken(user);
    return res.json({ ok: true, token, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}

async function disconnectGithub(req, res, next) {
  try {
    await userService.disconnectGithubAuth(req.user.id);
    const result = await repoSettingsService.unlinkGithubReposForUser(req.user.id);

    return res.json({
      ok: true,
      github: { connected: false, username: '' },
      unlinkedRepositories: result.modifiedCount || 0,
      message: 'GitHub account disconnected.',
    });
  } catch (err) {
    return next(err);
  }
}

async function startGithubOAuth(req, res, next) {
  try {
    const state = authService.issueOAuthState({
      userId: req.user.id,
      nonce: crypto.randomBytes(12).toString('hex'),
    });
    const url = githubOAuthService.buildAuthorizeUrl({ state });
    return res.json({ ok: true, url });
  } catch (err) {
    return next(err);
  }
}

async function handleGithubCallback(req, res, next) {
  try {
    const code = String(req.query?.code || '');
    const state = String(req.query?.state || '');

    if (!code || !state) {
      return res.status(400).json({ ok: false, error: 'missing_code', message: 'OAuth code/state missing' });
    }

    const payload = authService.verifyOAuthState(state);
    const accessToken = await githubOAuthService.exchangeCodeForToken({ code, state });
    const ghUser = await githubOAuthService.fetchGitHubUser(accessToken);

    await userService.updateGithubAuth({
      userId: payload.sub,
      githubUserId: ghUser.id,
      githubUsername: ghUser.login,
      accessToken,
    });

    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${redirectBase}?github=connected`);
  } catch (err) {
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${redirectBase}?github=error`);
  }
}

module.exports = {
  register,
  login,
  me,
  disconnectGithub,
  startGithubOAuth,
  handleGithubCallback,
};
