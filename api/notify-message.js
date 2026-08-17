/* Send email + push notification when a new message is received */
const https = require('https');

const RESEND_KEY = process.env.RESEND_API_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_SUBJECT = 'mailto:admin@everythingmarket.co.za';

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

async function sendEmail(to, senderName, adTitle, message) {
  if (!RESEND_KEY) return;
  const firstName = (to.split('@')[0] || 'there');
  await postJson('api.resend.com', '/emails', {
    from: 'Everything Market <admin@everythingmarket.co.za>',
    to: [to],
    subject: `New message from ${senderName} — ${adTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;">
        <div style="background:#0A3D22;padding:20px 28px;border-radius:8px 8px 0 0;text-align:center;">
          <img src="https://everythingmarket.co.za/logo.png" alt="Everything Market" width="200" style="max-width:200px;height:auto;display:inline-block;" onerror="this.style.display='none'">
        </div>
        <div style="padding:24px 28px;">
          <h2 style="color:#0A3D22;margin:0 0 4px;">New Message</h2>
          <p style="color:#555;margin:0 0 16px;">From <strong>${senderName}</strong> about <em>${adTitle}</em></p>
          <div style="background:#f4f4f4;border-radius:8px;padding:16px 20px;margin-bottom:24px;font-size:15px;line-height:1.6;color:#222;">
            ${message}
          </div>
          <a href="https://everythingmarket.co.za" style="display:inline-block;background:#1A7A42;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Reply on Everything Market</a>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #eee;">
          <p style="color:#aaa;font-size:12px;margin:0;">You received this because someone messaged you on <a href="https://everythingmarket.co.za" style="color:#1A7A42;">everythingmarket.co.za</a></p>
        </div>
      </div>`
  }, { 'Authorization': 'Bearer ' + RESEND_KEY });
}

/* ── Web Push (VAPID) ── */
async function sendPush(subscription, payload) {
  if (!VAPID_PRIVATE || !VAPID_PUBLIC) return;
  try {
    const crypto = require('crypto');
    const url = new URL(subscription.endpoint);

    /* Build VAPID JWT */
    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const claims = Buffer.from(JSON.stringify({ aud: url.origin, exp: now + 3600, sub: VAPID_SUBJECT })).toString('base64url');
    const unsigned = header + '.' + claims;

    const privBytes = Buffer.from(VAPID_PRIVATE, 'base64url');
    const privKey = crypto.createPrivateKey({
      key: Buffer.concat([
        Buffer.from('308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b0201010420', 'hex'),
        privBytes,
        Buffer.from('a144034200', 'hex'),
        Buffer.from(VAPID_PUBLIC, 'base64url')
      ]),
      format: 'der', type: 'pkcs8'
    });
    const sig = crypto.sign(null, Buffer.from(unsigned), { key: privKey, dsaEncoding: 'ieee-p1363' });
    const jwt = unsigned + '.' + sig.toString('base64url');
    const vapidAuth = `vapid t=${jwt},k=${VAPID_PUBLIC}`;

    /* Encrypt payload with ECDH + AES-128-GCM */
    const { p256dh, auth: authBase64 } = subscription.keys;
    const clientPubKey = Buffer.from(p256dh, 'base64url');
    const authSecret   = Buffer.from(authBase64, 'base64url');
    const serverPair   = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const serverPub    = serverPair.publicKey.export({ type: 'spki', format: 'der' }).slice(27);
    const serverPriv   = serverPair.privateKey;

    const clientKey = crypto.createPublicKey({ key: Buffer.concat([Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200','hex'), clientPubKey]), format: 'der', type: 'spki' });
    const sharedSecret = crypto.diffieHellman({ privateKey: serverPriv, publicKey: clientKey });

    /* HKDF helpers */
    function hkdf(salt, ikm, info, len) {
      const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
      const t = crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest();
      return t.slice(0, len);
    }
    const prk = crypto.createHmac('sha256', authSecret).update(Buffer.concat([sharedSecret, Buffer.from('Content-Encoding: auth\0'), clientPubKey, serverPub])).digest();
    const cekInfo  = Buffer.concat([Buffer.from('Content-Encoding: aesgcm\0'), clientPubKey, serverPub]);
    const nonceInfo = Buffer.concat([Buffer.from('Content-Encoding: nonce\0'), clientPubKey, serverPub]);
    const salt2 = crypto.randomBytes(16);
    const cek   = hkdf(salt2, prk, cekInfo, 16);
    const nonce = hkdf(salt2, prk, nonceInfo, 12);

    const plaintext = Buffer.concat([Buffer.alloc(2), Buffer.from(payload)]);
    const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
    const body = Buffer.concat([salt2, Buffer.from([0,0,16,0]), Buffer.from([serverPub.length]), serverPub, encrypted]);

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: url.hostname, path: url.pathname + url.search, method: 'POST',
        headers: {
          'Authorization': vapidAuth,
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aesgcm',
          'Encryption': 'salt=' + salt2.toString('base64url'),
          'Crypto-Key': 'dh=' + serverPub.toString('base64url'),
          'Content-Length': body.length,
          'TTL': '86400'
        }
      }, res => { let r=''; res.on('data',d=>r+=d); res.on('end',()=>resolve({status:res.statusCode,body:r})); });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch(e) {
    console.error('Push error:', e.message);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = '';
  await new Promise(r => { req.on('data', d => body += d); req.on('end', r); });
  const { recipient_email, sender_name, ad_title, message, push_subscription } = JSON.parse(body || '{}');

  if (!recipient_email) return res.status(400).json({ error: 'Missing recipient_email' });

  const results = await Promise.allSettled([
    sendEmail(recipient_email, sender_name || 'Someone', ad_title || 'your ad', message || ''),
    push_subscription ? sendPush(push_subscription, JSON.stringify({ title: `New message from ${sender_name || 'Someone'}`, body: message || '', url: 'https://everythingmarket.co.za' })) : Promise.resolve()
  ]);

  return res.status(200).json({ ok: true });
};
