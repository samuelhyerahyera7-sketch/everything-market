/* POST /api/apply-store — submit a store application */
'use strict';
const https = require('https');

const SB_URL  = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL.replace('https://', '');
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;
const SB_ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

function request(method, path, body, key, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST,
      path,
      method,
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function getAuthUser(authHeader) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return Promise.resolve(null);
  return request('GET', '/auth/v1/user', null, SB_ANON, { Authorization: 'Bearer ' + token })
    .then(r => {
      if (r.status !== 200) return null;
      try { return JSON.parse(r.body); } catch { return null; }
    })
    .catch(() => null);
}

function sanitizeText(value, max) {
  return String(value || '').trim().slice(0, max);
}

function sendAdminEmail({ storeName, storeDescription, storeType, cipcNumber, email }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return Promise.resolve();
  const payload = JSON.stringify({
    from: 'noreply@everythingmarket.co.za',
    to: 'admin@everythingmarket.co.za',
    subject: `New Store Application: ${storeName}`,
    html: `<h2>New Store Application</h2>
      <p><strong>Store Name:</strong> ${storeName}</p>
      <p><strong>Applicant Email:</strong> ${email || 'Unknown'}</p>
      <p><strong>Store Type:</strong> ${storeType}</p>
      <p><strong>CIPC Registration Number:</strong> ${cipcNumber || '(not provided)'}</p>
      <p><strong>Description:</strong> ${storeDescription || '(none)'}</p>
      <hr>
      <p>Review this application in the <a href="https://everythingmarket.co.za/admin">admin panel</a>.</p>`
  });

  return new Promise(resolve => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', resolve);
    req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_KEY) return res.status(500).json({ error: 'Store applications are not configured yet' });

  const user = await getAuthUser(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Please sign in again before applying.' });

  const body = req.body || {};
  const storeName = sanitizeText(body.store_name, 60);
  const storeDescription = sanitizeText(body.store_description, 300);
  const storeType = ['retail', 'dealership', 'services', 'wholesale', 'other'].includes(body.store_type)
    ? body.store_type
    : 'retail';
  const cipcNumber = sanitizeText(body.cipc_number, 30);
  const acceptedTerms = body.accepted_terms === true;

  if (!storeName) return res.status(400).json({ error: 'Store name is required' });
  if (!acceptedTerms) return res.status(400).json({ error: 'Please accept the Store Terms & Conditions before submitting.' });

  const existingRes = await request(
    'GET',
    `/rest/v1/store_applications?user_id=eq.${encodeURIComponent(user.id)}&select=id,status&limit=1`,
    null,
    SB_KEY
  );
  if (existingRes.status === 200) {
    try {
      const existing = JSON.parse(existingRes.body)[0];
      if (existing) {
        return res.status(409).json({
          error: existing.status === 'approved'
            ? 'Your store is already approved.'
            : existing.status === 'pending'
            ? 'You already have a pending application.'
            : 'Your previous application was rejected. Contact support.'
        });
      }
    } catch {}
  }

  const insertRes = await request(
    'POST',
    '/rest/v1/store_applications',
    {
      user_id: user.id,
      user_email: user.email,
      store_name: storeName,
      store_description: storeDescription,
      store_type: storeType,
      cipc_number: cipcNumber,
      status: 'pending'
    },
    SB_KEY,
    { Prefer: 'return=representation' }
  );

  if (insertRes.status < 200 || insertRes.status >= 300) {
    console.error('[apply-store]', insertRes.status, insertRes.body);
    return res.status(500).json({ error: 'Could not submit application. Please try again.' });
  }

  await sendAdminEmail({ storeName, storeDescription, storeType, cipcNumber, email: user.email });

  return res.status(200).json({ ok: true });
};
