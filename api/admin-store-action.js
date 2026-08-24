/* POST /api/admin-store-action — approve/reject store applications, manage subscriptions */
const https = require('https');
const { ADMIN_SECRET, verifyAdminToken } = require('./_admin-auth');

const SB_HOST = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co')
  .replace('https://', '').replace(/\/$/, '');
const SVC  = process.env.SUPABASE_SERVICE_KEY;
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';
const KEY  = SVC || ANON;

function sb(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST, path, method,
      headers: {
        apikey: key || KEY, Authorization: 'Bearer ' + (key || KEY),
        'Content-Type': 'application/json', Prefer: 'return=representation',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, b: d })); });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getAuthUserMeta(userId) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: SB_HOST,
      path: `/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      method: 'GET',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    }, r => {
      let raw = '';
      r.on('data', d => raw += d);
      r.on('end', () => {
        try { resolve(JSON.parse(raw).user_metadata || {}); }
        catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!ADMIN_SECRET) return res.status(500).json({ error: 'ADMIN_SECRET not configured' });

  const adminKey = req.headers['x-admin-key'] || '';
  if (!verifyAdminToken(req) && adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { action, store_id, rejection_reason, plan, paid_until_days } = body;

  /* ── Approve store ── */
  if (action === 'approve') {
    if (!store_id) return res.status(400).json({ error: 'Missing store_id' });

    /* Get the application */
    const appRes = await sb('GET', `/rest/v1/store_applications?id=eq.${store_id}&select=*`, null, KEY);
    const apps = JSON.parse(appRes.b || '[]');
    if (!apps.length) return res.status(404).json({ error: 'Application not found' });
    const app = apps[0];

    /* Update application status */
    await sb('PATCH', `/rest/v1/store_applications?id=eq.${store_id}`, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin'
    }, KEY);

    /* Update the user's metadata so frontend knows they're approved */
    if (app.user_id) {
      const existingMeta = await getAuthUserMeta(app.user_id);
      await new Promise((resolve, reject) => {
        const payload = JSON.stringify({
          user_metadata: {
            ...existingMeta,
            store_approved: true,
            store_name: app.store_name,
            store_id: store_id,
            store_type: app.store_type
          }
        });
        const req2 = https.request({
          hostname: SB_HOST,
          path: `/auth/v1/admin/users/${app.user_id}`,
          method: 'PUT',
          headers: {
            apikey: KEY, Authorization: 'Bearer ' + KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, r => { r.resume(); r.on('end', resolve); });
        req2.on('error', reject);
        req2.write(payload);
        req2.end();
      });
    }

    /* Create a trial subscription (30 days) */
    const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb('POST', '/rest/v1/store_subscriptions', {
      store_id, user_id: app.user_id,
      plan: plan || 'basic', status: 'trial',
      paid_until: paidUntil
    }, KEY);

    return res.status(200).json({ ok: true, message: 'Store approved, 30-day trial started' });
  }

  /* ── Reject store ── */
  if (action === 'reject') {
    if (!store_id) return res.status(400).json({ error: 'Missing store_id' });
    await sb('PATCH', `/rest/v1/store_applications?id=eq.${store_id}`, {
      status: 'rejected',
      rejection_reason: rejection_reason || 'Does not meet requirements',
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin'
    }, KEY);
    return res.status(200).json({ ok: true });
  }

  /* ── Delete store ── */
  if (action === 'delete_store') {
    if (!store_id) return res.status(400).json({ error: 'Missing store_id' });
    const appRes = await sb('GET', `/rest/v1/store_applications?id=eq.${encodeURIComponent(store_id)}&select=*`, null, KEY);
    const apps = JSON.parse(appRes.b || '[]');
    if (!apps.length) return res.status(404).json({ error: 'Store not found' });
    const app = apps[0];

    await sb('DELETE', `/rest/v1/store_products?store_id=eq.${encodeURIComponent(store_id)}`, null, KEY);
    await sb('DELETE', `/rest/v1/store_subscriptions?store_id=eq.${encodeURIComponent(store_id)}`, null, KEY);
    await sb('DELETE', `/rest/v1/store_categories?store_id=eq.${encodeURIComponent(store_id)}`, null, KEY);
    const delApp = await sb('DELETE', `/rest/v1/store_applications?id=eq.${encodeURIComponent(store_id)}`, null, KEY);
    if (delApp.s < 200 || delApp.s >= 300) {
      return res.status(500).json({ error: 'Could not delete store' });
    }

    if (app.user_id) {
      await new Promise(resolve => {
        const getReq = https.request({
          hostname: SB_HOST,
          path: `/auth/v1/admin/users/${encodeURIComponent(app.user_id)}`,
          method: 'GET',
          headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
        }, getRes => {
          let raw = '';
          getRes.on('data', d => raw += d);
          getRes.on('end', () => {
            let existingMeta = {};
            try { existingMeta = JSON.parse(raw).user_metadata || {}; } catch {}
            const payload = JSON.stringify({
              user_metadata: {
                ...existingMeta,
                store_approved: false,
                store_applied: false,
                store_name: null,
                store_id: null,
                store_type: null,
                store_subscription_until: null
              }
            });
            const req2 = https.request({
              hostname: SB_HOST,
              path: `/auth/v1/admin/users/${encodeURIComponent(app.user_id)}`,
              method: 'PUT',
              headers: {
                apikey: KEY, Authorization: 'Bearer ' + KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
              }
            }, r => { r.resume(); r.on('end', resolve); });
            req2.on('error', resolve);
            req2.write(payload);
            req2.end();
          });
        });
        getReq.on('error', resolve);
        getReq.end();
      });
    }

    return res.status(200).json({ ok: true });
  }

  /* ── Extend subscription ── */
  if (action === 'extend_subscription') {
    if (!store_id) return res.status(400).json({ error: 'Missing store_id' });
    const days = paid_until_days || 30;
    const paidUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await sb('PATCH', `/rest/v1/store_subscriptions?store_id=eq.${store_id}`, {
      status: 'active', paid_at: new Date().toISOString(), paid_until: paidUntil
    }, KEY);
    return res.status(200).json({ ok: true });
  }

  /* ── Get all applications (for admin panel) ── */
  if (action === 'list_applications') {
    const r = await sb('GET',
      '/rest/v1/store_applications?order=applied_at.desc&select=*', null, KEY);
    return res.status(200).json(JSON.parse(r.b || '[]'));
  }

  return res.status(400).json({ error: 'Unknown action' });
};
