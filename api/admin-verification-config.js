/* GET /api/admin-verification-config
   Admin-only readiness check for seller verification dependencies.
   Does not expose secret values.
*/
'use strict';
const https = require('https');
const http = require('http');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL_RAW.replace('https://', '');
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const BIO_URL = (process.env.BIOMETRIC_API_URL || '').replace(/\/$/, '');

function sbReq(method, path) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST,
      path,
      method,
      headers: {
        apikey: SB_KEY || '',
        Authorization: 'Bearer ' + (SB_KEY || ''),
        Accept: 'application/json',
      },
    }, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', e => resolve({ status: 0, body: String(e) }));
    req.end();
  });
}

function pingBio(path) {
  if (!BIO_URL) return Promise.resolve({ status: 0 });
  return new Promise(resolve => {
    let parsed;
    try { parsed = new URL(BIO_URL); } catch { return resolve({ status: 0 }); }
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path,
      method: 'GET',
      timeout: 5000,
    }, res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0 }); });
    req.on('error', () => resolve({ status: 0 }));
    req.end();
  });
}

function envStatus(name, testValue) {
  return { name, configured: !!testValue };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  const env = [
    envStatus('SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY),
    envStatus('META_WHATSAPP_BUSINESS_NUMBER', process.env.META_WHATSAPP_BUSINESS_NUMBER),
    envStatus('META_WEBHOOK_VERIFY_TOKEN', process.env.META_WEBHOOK_VERIFY_TOKEN),
    envStatus('META_APP_SECRET', process.env.META_APP_SECRET),
    envStatus('BIOMETRIC_API_URL', process.env.BIOMETRIC_API_URL),
    envStatus('BIOMETRIC_JWT_SECRET', process.env.BIOMETRIC_JWT_SECRET),
  ];

  const [phoneTable, bioTable, attemptsTable, bucket, health, ready] = await Promise.all([
    SB_KEY ? sbReq('GET', '/rest/v1/phone_verifications?select=id&limit=1') : Promise.resolve({ status: 0 }),
    SB_KEY ? sbReq('GET', '/rest/v1/biometric_verifications?select=id&limit=1') : Promise.resolve({ status: 0 }),
    SB_KEY ? sbReq('GET', '/rest/v1/verification_attempts?select=id&limit=1') : Promise.resolve({ status: 0 }),
    SB_KEY ? sbReq('GET', '/storage/v1/bucket/biometric-temp') : Promise.resolve({ status: 0 }),
    pingBio('/healthz'),
    pingBio('/readyz'),
  ]);

  const checks = [
    { name: 'phone_verifications table', ok: phoneTable.status === 200 },
    { name: 'biometric_verifications table', ok: bioTable.status === 200 },
    { name: 'verification_attempts table', ok: attemptsTable.status === 200 },
    { name: 'biometric-temp storage bucket', ok: bucket.status === 200 },
    { name: 'biometric service healthz', ok: health.status === 200, status: health.status || 'unreachable' },
    { name: 'biometric service readyz', ok: ready.status === 200, status: ready.status || 'unreachable' },
  ];

  const ok = env.every(e => e.configured) && checks.every(c => c.ok);
  return res.status(200).json({ ok, env, checks });
};
