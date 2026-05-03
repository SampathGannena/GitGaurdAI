const authService = require('../services/authService');

function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'auth_required', message: 'Missing bearer token' });
  }

  const token = header.slice(7).trim();
  try {
    const payload = authService.verifyAuthToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'invalid_token', message: err.message || 'Invalid auth token' });
  }
}

module.exports = { requireAuth };