/* Vercel serverless function — insert an ad using the service key.
   This bypasses Supabase RLS so any visitor can post a public ad.
   Required env vars (Vercel dashboard):
     SUPABASE_URL         – https://jucphfbaueowzlbjhxmm.supabase.co
     SUPABASE_SERVICE_KEY – service-role key (never expose to frontend)
*/

const SB_URL = process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const required = ['title', 'cat', 'loc', 'seller'];
  for (const f of required) {
    if (!body[f] || !String(body[f]).trim()) {
      return res.status(400).json({ error: `Missing required field: ${f}` });
    }
  }

  const payload = {
    title:        String(body.title).trim().slice(0, 200),
    cat:          String(body.cat).trim(),
    price:        Math.max(0, Number(body.price) || 0),
    loc:          String(body.loc).trim().slice(0, 100),
    seller:       String(body.seller).trim().slice(0, 100),
    seller_type:  body.seller_type === 'business' ? 'business' : 'private',
    description:  String(body.description || '').trim().slice(0, 5000),
    cond:         String(body.cond || 'N/A').trim().slice(0, 50),
    neg:          !!body.neg,
    photos:       Array.isArray(body.photos) ? body.photos.slice(0, 10) : [],
    phone:        String(body.phone || '').trim().slice(0, 30),
    contact_email:String(body.contact_email || '').trim().slice(0, 100),
    verified:     false,
  };
  if (body.user_id) payload.user_id = String(body.user_id);

  try {
    const r = await fetch(SB_URL + '/rest/v1/ads', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) {
      console.error('[store-ad] Supabase error', r.status, text);
      return res.status(502).json({ error: text });
    }

    const rows = JSON.parse(text);
    return res.status(200).json({ ok: true, id: rows[0]?.id || null });
  } catch (e) {
    console.error('[store-ad] exception', e);
    return res.status(500).json({ error: String(e) });
  }
};
