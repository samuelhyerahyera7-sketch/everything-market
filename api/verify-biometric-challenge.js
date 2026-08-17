/* GET /api/verify-biometric-challenge
   Fetches a one-time nonce + blink challenge from the biometric service.
   The nonce MUST be used in the next /verify-biometric-submit call.
   Returns: { challenge, instruction, nonce, expiresAt }
*/
'use strict';
const https  = require('https');
const crypto = require('crypto');

const SB_URL      = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST     = SB_URL.replace('https://', '');
const SB_KEY      = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON     = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const BIO_URL     = (process.env.BIOMETRIC_API_URL || '').replace(/\/$/, '');
const BIO_SECRET  = process.env.BIOMETRIC_JWT_SECRET || '';

function getAuthUser(authHeader) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return Promise.resolve(null);
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST, path: '/auth/v1/user', method: 'GET',
      headers: { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + token }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve(null);
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function mintBioJwt(userId) {
  if (!BIO_SECRET) throw new Error('BIOMETRIC_JWT_SECRET not configured');
  const hdr  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pl   = Buffer.from(JSON.stringify({
    sub: userId.replace(/-/g, '').slice(0, 64),
    iss: 'biometrical',
    aud: 'biometrical-verify',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', BIO_SECRET)
    .update(hdr + '.' + pl).digest('base64url');
  return hdr + '.' + pl + '.' + sig;
}

function callBioService(path, method, jwt, body) {
  const bioHost = new URL(BIO_URL).hostname;
  const bioPort = new URL(BIO_URL).port || (BIO_URL.startsWith('https') ? 443 : 80);
  const isHttps = BIO_URL.startsWith('https');
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: bioHost,
      port: Number(bioPort),
      path, method,
      headers: {
        'Authorization': 'Bearer ' + jwt,
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const lib = isHttps ? https : require('http');
    const req = lib.request(opts, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req.headers['authorization']);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  if (!BIO_URL) {
    return res.status(503).json({ error: 'Biometric service not configured' });
  }

  let jwt;
  try { jwt = mintBioJwt(user.id); }
  catch (e) { return res.status(500).json({ error: 'Server configuration error' }); }

  try {
    const r = await callBioService('/api/v1/verify/challenge', 'GET', jwt, null);
    if (r.status !== 200) {
      console.error('[bio-challenge] Service returned:', r.status, r.body.slice(0, 200));
      return res.status(502).json({ error: 'Biometric service unavailable' });
    }
    const data = JSON.parse(r.body);
    /* Only forward the fields the client needs — never forward internal service details */
    return res.status(200).json({
      challenge:   data.challenge,
      instruction: data.instruction,
      nonce:       data.nonce,
      expiresAt:   data.expires_at
    });
  } catch (e) {
    console.error('[bio-challenge] Error:', e.message);
    return res.status(502).json({ error: 'Could not reach biometric service' });
  }
};
