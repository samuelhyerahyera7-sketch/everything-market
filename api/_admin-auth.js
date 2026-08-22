const crypto = require('crypto');

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function getSigningSecret() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  return process.env.ADMIN_SESSION_SECRET || serviceKey || ADMIN_SECRET;
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
}

function createAdminToken() {
  if (!ADMIN_SECRET || !getSigningSecret()) return null;
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const encoded = base64url(payload);
  return encoded + '.' + sign(encoded);
}

function verifyAdminToken(req) {
  if (!ADMIN_SECRET || !getSigningSecret()) return false;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const expected = sign(parts[0]);
  const actual = parts[1];
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return payload.role === 'admin' && payload.exp > Date.now();
  } catch (_) {
    return false;
  }
}

function requireAdmin(req, res) {
  if (verifyAdminToken(req)) return true;
  res.status(401).json({ error: 'Admin authentication required' });
  return false;
}

module.exports = {
  ADMIN_SECRET,
  createAdminToken,
  requireAdmin,
  verifyAdminToken,
};
