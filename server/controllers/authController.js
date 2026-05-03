const User = require('../models/User');
const authService = require('../services/authService');

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

module.exports = {
  register,
  login,
  me,
};