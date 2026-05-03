const crypto = require('crypto');

function verifyGithubSignature(req, res, next) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'server_misconfigured', message: 'WEBHOOK_SECRET is missing' });
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(401).json({ error: 'invalid_signature', message: 'Missing signature header' });
  }

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(req.rawBody || '').digest('hex')}`;
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'invalid_signature', message: 'Signature mismatch' });
  }

  next();
}

module.exports = { verifyGithubSignature };
