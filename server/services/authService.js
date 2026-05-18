const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

function toBase64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedBuffer = Buffer.from(derived, 'hex');

  if (hashBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
}

function getTokenSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is required');
  }
  return secret;
}

function signToken(payload) {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getTokenSecret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function issueAuthToken(user) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  });
}

function issueOAuthState({ userId, nonce }) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({
    sub: String(userId),
    nonce,
    typ: 'github_oauth',
    iat: now,
    exp: now + OAUTH_STATE_TTL_SECONDS,
  });
}

function verifyOAuthState(token) {
  const payload = verifyAuthToken(token);
  if (payload.typ !== 'github_oauth') {
    throw new Error('Invalid OAuth state token');
  }
  return payload;
}

function verifyAuthToken(token) {
  const [header, body, signature] = String(token || '').split('.');
  if (!header || !body || !signature) {
    throw new Error('Invalid token format');
  }

  const expectedSig = crypto.createHmac('sha256', getTokenSecret()).update(`${header}.${body}`).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (err) {
    throw new Error('Invalid token payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    throw new Error('Token expired');
  }

  return payload;
}

module.exports = {
  hashPassword,
  verifyPassword,
  issueAuthToken,
  verifyAuthToken,
  issueOAuthState,
  verifyOAuthState,
};