/* Vercel serverless — load all messages from events table */
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    const r = await new Promise((resolve, reject) => {
      const path = '/rest/v1/events?event_type=eq.em_message&order=created_at.desc&limit=1000&select=id,created_at,payload';
      const req2 = https.request({
        hostname: SB_HOST,
        path,
        method: 'GET',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json',
        }
      }, res2 => {
        let raw = '';
        res2.on('data', d => { raw += d; });
        res2.on('end', () => resolve({ status: res2.statusCode, body: raw }));
      });
      req2.on('error', reject);
      req2.end();
    });

    if (r.status !== 200) return res.status(502).json({ error: 'DB error ' + r.status });
    const rows = JSON.parse(r.body);

    /* Group into conversation threads: key = sorted emails + ad_title */
    const threads = {};
    rows.forEach(row => {
      const p = row.payload || {};
      const emails = [p.sender_email || '', p.recipient_email || ''].sort().join('||');
      const key = emails + '||' + (p.ad_title || '');
      if (!threads[key]) {
        threads[key] = {
          key,
          sender_email:    p.sender_email || '',
          sender_name:     p.sender_name  || '',
          recipient_email: p.recipient_email || '',
          seller:          p.seller || '',
          ad_title:        p.ad_title || '',
          messages: [],
          last_at: row.created_at,
        };
      }
      threads[key].messages.push({
        id:      row.id,
        time:    row.created_at,
        from:    p.sender_email || '',
        from_name: p.sender_name || '',
        text:    p.message || '',
        dir:     'out',
      });
      if (new Date(row.created_at) > new Date(threads[key].last_at)) {
        threads[key].last_at = row.created_at;
      }
    });

    const out = Object.values(threads).sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
    return res.status(200).json(out);
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
