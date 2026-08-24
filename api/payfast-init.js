/* Vercel serverless function — generates a signed PayFast payment form.
   Required env vars (set in Vercel dashboard):
     PAYFAST_MERCHANT_ID   – from your PayFast account
     PAYFAST_MERCHANT_KEY  – from your PayFast account
     PAYFAST_PASSPHRASE    – optional, set in PayFast account settings
     PAYFAST_SANDBOX       – set to "true" while testing
*/
const crypto = require('crypto');

const PLANS = {
  '35': { days: 7,  label: '7-Day Boost' },
  '65': { days: 14, label: '14-Day Boost' },
  '95': { days: 30, label: '30-Day Boost' },
};

function pfSignature(fields, passphrase) {
  const str = Object.keys(fields)
    .filter(k => fields[k] !== '' && fields[k] != null)
    .map(k => `${k}=${encodeURIComponent(String(fields[k])).replace(/%20/g, '+')}`)
    .join('&') + (passphrase ? '&passphrase=' + encodeURIComponent(passphrase).replace(/%20/g, '+') : '');
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { adId, amount, adTitle, origin: siteOrigin } = req.query;
  if (!adId || !amount || !PLANS[String(amount)]) {
    return res.status(400).json({ error: 'Missing or invalid adId / amount' });
  }

  const merchantId  = process.env.PAYFAST_MERCHANT_ID  || '10000100';   // sandbox default
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY  || '46f0cd694581a'; // sandbox default
  const passphrase  = process.env.PAYFAST_PASSPHRASE    || '';
  const sandbox     = (process.env.PAYFAST_SANDBOX || 'true') === 'true';
  const pfUrl       = sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const origin = siteOrigin || 'https://everything-market.vercel.app';
  const plan   = PLANS[String(amount)];

  const fields = {
    merchant_id:       merchantId,
    merchant_key:      merchantKey,
    return_url:        origin + '/?boost=success',
    cancel_url:        origin + '/?boost=cancel',
    notify_url:        origin + '/api/payfast-notify',
    amount:            Number(amount).toFixed(2),
    item_name:         plan.label + ' — Everything Market',
    item_description:  (adTitle || 'Ad listing') + ' (' + plan.days + ' days)',
    custom_str1:       String(adId),
    custom_str2:       String(plan.days),
  };

  fields.signature = pfSignature(fields, passphrase);

  return res.status(200).json({ pfUrl, fields });
};
