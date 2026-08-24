/* Vercel serverless function — PayFast ITN (Instant Transaction Notification).
   PayFast POSTs here after every payment attempt.
   Required env vars (set in Vercel dashboard):
     SUPABASE_URL          – e.g. https://xxx.supabase.co
     SUPABASE_SERVICE_KEY  – service-role key (never expose to frontend)
     PAYFAST_SANDBOX       – "true" while testing
*/
const https = require('https');

const SB_URL = process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

const VALID_AMOUNTS = { '35.00': 7, '65.00': 14, '95.00': 30 };

function validateITN(rawBody, sandbox) {
  return new Promise((resolve) => {
    const host = sandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
    const options = {
      hostname: host,
      path: '/eng/query/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(rawBody),
      },
    };
    const req = https.request(options, (pfRes) => {
      let body = '';
      pfRes.on('data', (d) => { body += d; });
      pfRes.on('end', () => resolve(body.trim().toUpperCase() === 'VALID'));
    });
    req.on('error', () => resolve(false));
    req.write(rawBody);
    req.end();
  });
}

async function markSponsored(adId, days) {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const r = await fetch(`${SB_URL}/rest/v1/ads?id=eq.${encodeURIComponent(adId)}`, {
    method: 'PATCH',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sponsored: true, sponsored_until: until }),
  });
  return r.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sandbox = (process.env.PAYFAST_SANDBOX || 'true') === 'true';

  /* Rebuild raw body for ITN validation */
  const data   = req.body || {};
  const rawBody = new URLSearchParams(data).toString();

  const valid = await validateITN(rawBody, sandbox);
  if (!valid) {
    console.error('[PayFast] ITN validation failed');
    return res.status(400).send('INVALID');
  }

  if (data.payment_status !== 'COMPLETE') return res.status(200).send('OK');

  const adId  = data.custom_str1;
  const days  = VALID_AMOUNTS[parseFloat(data.amount_gross).toFixed(2)];

  if (!adId || !days) {
    console.error('[PayFast] Unknown plan or missing adId', { adId, amount: data.amount_gross });
    return res.status(200).send('OK');
  }

  const ok = await markSponsored(adId, days);
  console.log(`[PayFast] markSponsored ad=${adId} days=${days} ok=${ok}`);
  return res.status(200).send('OK');
};
