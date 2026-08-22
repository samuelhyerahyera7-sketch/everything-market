/* /api/store-settings — owner-managed storefront profile */
'use strict';
const https = require('https');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL_RAW.replace('https://', '');
const SVC = process.env.SUPABASE_SERVICE_KEY;
const ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const KEY = SVC || ANON;

function sb(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST,
      path,
      method,
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...extraHeaders,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getUser(jwt) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST,
      path: '/auth/v1/user',
      method: 'GET',
      headers: { apikey: ANON, Authorization: 'Bearer ' + jwt }
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

function cleanText(value, max) {
  return String(value || '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  if (!SVC) return res.status(500).json({ error: 'Store settings are not configured' });

  const jwt = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return res.status(401).json({ error: 'Not authenticated' });
  const user = await getUser(jwt);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const storeRes = await sb(
    'GET',
    `/rest/v1/store_applications?user_id=eq.${encodeURIComponent(user.id)}&status=eq.approved&select=*&limit=1`
  );
  const stores = JSON.parse(storeRes.body || '[]');
  const store = Array.isArray(stores) ? stores[0] : null;
  if (!store) return res.status(403).json({ error: 'No approved store' });

  if (req.method === 'GET') return res.status(200).json(store);

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const storeName = cleanText(body.store_name, 80);
  const storeDescription = cleanText(body.store_description, 500);
  const storeType = ['retail', 'dealership', 'services', 'wholesale', 'other'].includes(body.store_type)
    ? body.store_type
    : store.store_type;
  const logoUrl = cleanText(body.logo_url, 1000);

  if (!storeName) return res.status(400).json({ error: 'Store name is required' });

  const patch = {
    store_name: storeName,
    store_description: storeDescription,
    store_type: storeType,
    logo_url: logoUrl || null
  };
  const update = await sb('PATCH', `/rest/v1/store_applications?id=eq.${encodeURIComponent(store.id)}`, patch);
  if (update.status < 200 || update.status >= 300) {
    return res.status(500).json({ error: 'Could not update store settings' });
  }

  const metaPayload = JSON.stringify({
    user_metadata: {
      ...(user.user_metadata || {}),
      store_approved: true,
      store_name: storeName,
      store_id: store.id,
      store_type: storeType
    }
  });
  await new Promise(resolve => {
    const req2 = https.request({
      hostname: SB_HOST,
      path: `/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
      method: 'PUT',
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(metaPayload)
      }
    }, r => { r.resume(); r.on('end', resolve); });
    req2.on('error', resolve);
    req2.write(metaPayload);
    req2.end();
  });

  const rows = JSON.parse(update.body || '[]');
  return res.status(200).json(Array.isArray(rows) ? rows[0] : { ok: true, ...patch });
};
