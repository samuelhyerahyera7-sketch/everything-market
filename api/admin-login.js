const crypto = require('crypto');
const { ADMIN_SECRET, createAdminToken } = require('./_admin-auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ADMIN_SECRET) return res.status(500).json({ error: 'ADMIN_SECRET not configured' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const password = String(body.password || '');
  const expected = Buffer.from(ADMIN_SECRET);
  const actual = Buffer.from(password);
  const validLength = expected.length === actual.length;
  const valid = validLength && crypto.timingSafeEqual(expected, actual);

  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const token = createAdminToken();
  if (!token) return res.status(500).json({ error: 'Admin session could not be created' });
  return res.status(200).json({ token });
};
