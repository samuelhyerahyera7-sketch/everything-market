/* Vercel serverless — list all registered users via Supabase Auth admin API */
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST    = SB_URL_RAW.replace('https://', '');
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY;

function sbReq(method, path, body) {
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    /* Fetch up to 1000 users from auth admin API */
    const r = await sbReq('GET', '/auth/v1/admin/users?page=1&per_page=1000');
    if (r.status !== 200) return res.status(502).json({ error: 'Auth API error ' + r.status });
    const parsed = JSON.parse(r.body);
    const users = parsed.users || parsed || [];

    /* Also fetch ads to count per-user ad totals and surface listing-only sellers */
    const rAds = await sbReq('GET', '/rest/v1/ads?select=user_id,seller_email,contact_email,seller,phone,created_at,verified');
    const ads = rAds.status === 200 ? JSON.parse(rAds.body) : [];
    const adCountsByUserId = {};
    const adCountsByEmail = {};
    const sellerProfiles = {};
    ads.forEach(a => {
      const email = (a.contact_email || a.seller_email || '').toLowerCase();
      if (a.user_id) adCountsByUserId[a.user_id] = (adCountsByUserId[a.user_id] || 0) + 1;
      if (email) adCountsByEmail[email] = (adCountsByEmail[email] || 0) + 1;
      if (email) {
        if (!sellerProfiles[email]) {
          sellerProfiles[email] = {
            email,
            name: a.seller || '',
            phone: a.phone || '',
            first_ad_at: a.created_at,
            last_ad_at: a.created_at,
            verified: false,
          };
        }
        if (a.phone && !sellerProfiles[email].phone) sellerProfiles[email].phone = a.phone;
        if (a.seller && !sellerProfiles[email].name) sellerProfiles[email].name = a.seller;
        if (a.verified) sellerProfiles[email].verified = true;
        if (a.created_at && (!sellerProfiles[email].last_ad_at || new Date(a.created_at) > new Date(sellerProfiles[email].last_ad_at))) {
          sellerProfiles[email].last_ad_at = a.created_at;
        }
      }
    });
    /* suspended is an optional column added by supabase-suspend.sql — query it
       separately so a not-yet-migrated database never breaks the user list. */
    const suspendedByUserId = {};
    const suspendedByEmail = {};
    const rSuspended = await sbReq('GET', '/rest/v1/ads?select=user_id,contact_email&suspended=eq.true');
    if (rSuspended.status === 200) {
      try {
        JSON.parse(rSuspended.body).forEach(row => {
          if (row.user_id) suspendedByUserId[row.user_id] = true;
          const e = String(row.contact_email || '').toLowerCase();
          if (e) suspendedByEmail[e] = true;
        });
      } catch {}
    }

    const authEmails = new Set(users.map(u => String(u.email || '').toLowerCase()).filter(Boolean));
    const userIds = users.map(u => u.id).filter(Boolean);
    let phoneByUser = {};
    let bioByUser = {};

    if (userIds.length) {
      const idList = userIds.map(id => encodeURIComponent(id)).join(',');
      const [rPhones, rBio] = await Promise.all([
        sbReq('GET', `/rest/v1/phone_verifications?user_id=in.(${idList})&status=eq.verified&select=user_id,phone_number,verified_at&order=verified_at.desc`),
        sbReq('GET', `/rest/v1/biometric_verifications?user_id=in.(${idList})&select=user_id,status,admin_decision,rejection_reason,verified_at,updated_at,verification_provider,verification_reference,receipt,admin_notes,admin_reviewed_at&order=updated_at.desc`)
      ]);
      const phones = rPhones.status === 200 ? JSON.parse(rPhones.body) : [];
      const bios = rBio.status === 200 ? JSON.parse(rBio.body) : [];
      phones.forEach(p => {
        if (!phoneByUser[p.user_id]) phoneByUser[p.user_id] = p;
      });
      bios.forEach(b => {
        if (!bioByUser[b.user_id]) bioByUser[b.user_id] = b;
      });
    }

    function verificationLevel(u) {
      const phone = !!phoneByUser[u.id];
      const bio = bioByUser[u.id];
      const bioStatus = bio?.admin_decision === 'approved' ? 'approved' :
                        bio?.admin_decision === 'rejected' ? 'rejected' :
                        (bio?.status || 'none');
      const email = !!u.confirmed_at;
      if ((email && phone && bioStatus === 'approved') || u.user_metadata?.verified) return 'Verified Seller';
      if (bioStatus === 'processing' || bioStatus === 'review') return 'Verification Pending';
      return 'Not Verified';
    }

    const out = users.map(u => ({
      id:         u.id,
      email:      u.email,
      name:       u.user_metadata?.name || u.user_metadata?.full_name || '',
      phone:      sellerProfiles[String(u.email || '').toLowerCase()]?.phone || '',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      confirmed:  !!u.confirmed_at,
      verified:   !!u.user_metadata?.verified,
      suspended:  (!!u.banned_until && new Date(u.banned_until).getTime() > Date.now()) ||
                  !!suspendedByUserId[u.id] || !!suspendedByEmail[String(u.email || '').toLowerCase()],
      auth_user:  true,
      source:     'registered',
      ad_count:   adCountsByUserId[u.id] || adCountsByEmail[String(u.email || '').toLowerCase()] || 0,
      last_ad_at: sellerProfiles[String(u.email || '').toLowerCase()]?.last_ad_at || null,
      verification: {
        level: verificationLevel(u),
        email_verified: !!u.confirmed_at,
        phone_verified: !!phoneByUser[u.id],
        phone_masked: phoneByUser[u.id]?.phone_number
          ? '+' + String(phoneByUser[u.id].phone_number).replace(/\D/g, '').slice(0, 4) + ' *** ' + String(phoneByUser[u.id].phone_number).replace(/\D/g, '').slice(-4)
          : null,
        identity_status: bioByUser[u.id]?.admin_decision || bioByUser[u.id]?.status || 'none',
        rejection_reason: bioByUser[u.id]?.rejection_reason || null,
        provider: bioByUser[u.id]?.verification_provider || null,
        reference: bioByUser[u.id]?.verification_reference || null,
        admin_notes: bioByUser[u.id]?.admin_notes || null,
        admin_reviewed_at: bioByUser[u.id]?.admin_reviewed_at || null,
        manual_files: bioByUser[u.id]?.receipt?.files || null,
        verified_at: bioByUser[u.id]?.verified_at || phoneByUser[u.id]?.verified_at || null,
      },
    }));

    Object.values(sellerProfiles).forEach(s => {
      if (authEmails.has(s.email)) return;
      out.push({
        id: 'seller:' + s.email,
        email: s.email,
        name: s.name || 'Listing Seller',
        phone: s.phone || '',
        created_at: s.first_ad_at,
        last_sign_in: null,
        confirmed: false,
        verified: !!s.verified,
        suspended: !!suspendedByEmail[s.email],
        auth_user: false,
        source: 'listing_seller',
        ad_count: adCountsByEmail[s.email] || 0,
        last_ad_at: s.last_ad_at || null,
        verification: {
          level: s.verified ? 'Verified Seller' : 'Not Verified',
          email_verified: false,
          phone_verified: false,
          identity_status: s.verified ? 'approved' : 'none',
        },
      });
    });

    return res.status(200).json(out);
  } catch(e) {
    return res.status(500).json({ error: String(e) });
  }
};
