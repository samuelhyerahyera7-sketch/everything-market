/* Admin-only — suspend/unsuspend or delete a single ad, optionally emailing
   the seller that their listing was actioned for a policy violation, and
   optionally resolving the report that prompted the action.
*/
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW  = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST     = SB_URL_RAW.replace('https://', '');
const SB_KEY      = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY  = process.env.RESEND_API_KEY;

function sbReq(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: SB_HOST,
      path,
      method,
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function postJson(hostname, path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendPolicyEmail(to, adTitle, actionLabel, reason) {
  if (!RESEND_KEY || !to) return;
  await postJson('api.resend.com', '/emails', {
    from: 'Everything Market <admin@everythingmarket.co.za>',
    to: [to],
    subject: `Your listing has been ${actionLabel} — ${adTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;">
        <div style="background:#0A3D22;padding:20px 28px;border-radius:8px 8px 0 0;text-align:center;">
          <img src="https://everythingmarket.co.za/logo.png" alt="Everything Market" width="200" style="max-width:200px;height:auto;display:inline-block;" onerror="this.style.display='none'">
        </div>
        <div style="padding:24px 28px;">
          <h2 style="color:#0A3D22;margin:0 0 4px;">Listing ${actionLabel}</h2>
          <p style="color:#555;margin:0 0 16px;">Your listing <em>${adTitle}</em> has been ${actionLabel} for infringing our policy guidelines.</p>
          <div style="background:#f4f4f4;border-radius:8px;padding:16px 20px;margin-bottom:24px;font-size:15px;line-height:1.6;color:#222;">
            ${reason || 'It did not meet our listing guidelines.'}
          </div>
          <p style="color:#555;font-size:13px;line-height:1.6;">If you believe this was a mistake, reply to this email or contact us at admin@everythingmarket.co.za.</p>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #eee;">
          <p style="color:#aaa;font-size:12px;margin:0;">Everything Market · <a href="https://everythingmarket.co.za" style="color:#1A7A42;">everythingmarket.co.za</a></p>
        </div>
      </div>`
  }, { 'Authorization': 'Bearer ' + RESEND_KEY }).catch(e => console.error('[moderate-ad] email failed', e));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { id, action, reason, report_id, notify } = body || {};
  if (!id) return res.status(400).json({ error: 'Missing ad id' });
  if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'action must be suspend, unsuspend, or delete' });
  }

  try {
    const fetchRes = await sbReq('GET', `/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}&select=title,contact_email`);
    if (fetchRes.status !== 200) return res.status(502).json({ error: 'DB error ' + fetchRes.status });
    const rows = JSON.parse(fetchRes.body || '[]');
    const ad = rows[0];
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    if (action === 'delete') {
      const r = await sbReq('DELETE', `/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}`);
      if (r.status !== 200 && r.status !== 204) return res.status(502).json({ error: 'DB error ' + r.status });
    } else {
      const r = await sbReq('PATCH', `/rest/v1/ads?id=eq.${encodeURIComponent(String(id))}`, { suspended: action === 'suspend' });
      if (r.status !== 200 && r.status !== 204) return res.status(502).json({ error: 'DB error ' + r.status });
    }

    const actionLabel = action === 'delete' ? 'removed' : action === 'suspend' ? 'suspended' : 'reinstated';
    if (notify !== false && (action === 'delete' || action === 'suspend') && ad.contact_email) {
      await sendPolicyEmail(ad.contact_email, ad.title || 'your listing', actionLabel, reason);
    }

    if (report_id) {
      await sbReq('PATCH', `/rest/v1/reports?id=eq.${encodeURIComponent(String(report_id))}`, {
        status: 'actioned',
        admin_action: action,
        admin_notes: String(reason || '').slice(0, 500),
        resolved_at: new Date().toISOString()
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
