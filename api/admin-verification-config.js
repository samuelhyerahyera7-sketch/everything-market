/* GET /api/admin-verification-config
   Admin-only readiness check for seller verification dependencies.
   Does not expose secret values.
*/
'use strict';
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL_RAW.replace('https://', '');
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

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
  ];

  const [phoneTable, bioTable, attemptsTable, bucket] = await Promise.all([
    SB_KEY ? sbReq('GET', '/rest/v1/phone_verifications?select=id&limit=1') : Promise.resolve({ status: 0 }),
    SB_KEY ? sbReq('GET', '/rest/v1/biometric_verifications?select=id&limit=1') : Promise.resolve({ status: 0 }),
    SB_KEY ? sbReq('GET', '/rest/v1/verification_attempts?select=id&limit=1') : Promise.resolve({ status: 0 }),
    SB_KEY ? sbReq('GET', '/storage/v1/bucket/biometric-temp') : Promise.resolve({ status: 0 }),
  ]);

  const checks = [
    { name: 'phone_verifications table', ok: phoneTable.status === 200 },
    { name: 'identity selfie + ID review table', ok: bioTable.status === 200 },
    { name: 'verification_attempts table', ok: attemptsTable.status === 200 },
    { name: 'private selfie + ID storage bucket', ok: bucket.status === 200 },
  ];

  const ok = !!process.env.SUPABASE_SERVICE_KEY && checks.every(c => c.ok);
  const nextSteps = [];
  if (!process.env.META_WHATSAPP_BUSINESS_NUMBER || !process.env.META_WEBHOOK_VERIFY_TOKEN || !process.env.META_APP_SECRET) {
    nextSteps.push('Create/connect a Meta WhatsApp Business app, set the webhook to https://www.everythingmarket.co.za/api/whatsapp-webhook, then add the WhatsApp number, verify token, and app secret in Vercel.');
  }
  if (!checks.find(c => c.name === 'private selfie + ID storage bucket')?.ok) {
    nextSteps.push('Create a private Supabase Storage bucket named biometric-temp.');
  }
  return res.status(200).json({ ok, env, checks, nextSteps });
};
