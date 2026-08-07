/* ── EverythingMarket Analytics + Safety (Supabase) ── */
(function () {
  const SB_URL = 'https://jucphfbaueowzlbjhxmm.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

  function sbHeaders() {
    return {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
  }

  /* ── Event tracking (batched) ── */
  const queue = [];
  let timer = null;

  function track(type, payload) {
    queue.push({ event_type: type, payload: payload || null, created_at: new Date().toISOString() });
    if (queue.length >= 10) flush();
    else if (!timer) timer = setTimeout(flush, 45000);
  }

  async function flush() {
    if (!queue.length) return;
    clearTimeout(timer);
    timer = null;
    const batch = queue.splice(0, queue.length);
    try {
      await fetch(SB_URL + '/rest/v1/events', {
        method: 'POST', headers: sbHeaders(), body: JSON.stringify(batch)
      });
    } catch (_) {}
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  /* ── Get auth token: use logged-in user JWT if available, else anon key ── */
  async function _getAuthToken() {
    try {
      if (window._sb) {
        const { data: { session } } = await window._sb.auth.getSession();
        if (session && session.access_token) return session.access_token;
      }
    } catch (_) {}
    return SB_KEY;
  }

  /* ── Upload a single photo (base64 data URL) to ad-photos storage ── */
  async function _uploadPhoto(adId, index, dataUrl, authToken) {
    try {
      const res  = await fetch(dataUrl);
      const blob = await res.blob();
      const ext  = (blob.type || 'image/jpeg').split('/')[1] || 'jpg';
      const path = adId + '/' + index + '.' + ext;

      const r = await fetch(SB_URL + '/storage/v1/object/ad-photos/' + path, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (authToken || SB_KEY), 'Content-Type': blob.type },
        body: blob
      });
      if (!r.ok) return null;
      return SB_URL + '/storage/v1/object/public/ad-photos/' + path;
    } catch (_) { return null; }
  }

  /* ── Store full ad: upload photos, then insert row ── */
  async function storeAd(listing) {
    const authToken = await _getAuthToken();
    const folderKey = 'ad-' + String(listing.id);
    const photoUrls = [];
    if (Array.isArray(listing.photos) && listing.photos.length) {
      for (let i = 0; i < listing.photos.length; i++) {
        const url = await _uploadPhoto(folderKey, i, listing.photos[i], authToken);
        if (url) photoUrls.push(url);
      }
    }

    const payload = {
      title: listing.title,
      cat: listing.cat,
      price: listing.price,
      loc: listing.loc,
      seller: listing.seller,
      seller_type: listing.sellerType || 'private',
      description: listing.desc || '',
      cond: listing.cond || 'N/A',
      neg: listing.neg || false,
      photos: photoUrls,
      phone: listing.phone || '',
      contact_email: listing.contactEmail || '',
      verified: false,
      user_id: listing.userId || null
    };

    /* Prefer the Supabase JS client — it handles token refresh and gives real error objects */
    if (window._sb) {
      const { data, error } = await window._sb.from('ads').insert(payload).select();
      if (error) {
        console.error('[EM] storeAd failed:', error.code, error.message, error.details);
        return { ok: false, error };
      }
      if (data && data[0] && data[0].id && window.LISTINGS) {
        const local = window.LISTINGS.find(l => l.id === listing.id);
        if (local) { local._sbId = data[0].id; local.id = data[0].id; }
      }
      return { ok: true };
    }

    /* Fallback: raw fetch */
    try {
      const r = await fetch(SB_URL + '/rest/v1/ads', {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + authToken, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const errText = await r.text();
        console.error('[EM] storeAd HTTP error:', r.status, errText);
        return { ok: false, error: errText };
      }
      const rows = await r.json();
      if (rows && rows[0] && rows[0].id && window.LISTINGS) {
        const local = window.LISTINGS.find(l => l.id === listing.id);
        if (local) { local._sbId = rows[0].id; local.id = rows[0].id; }
      }
      return { ok: true };
    } catch (e) {
      console.error('[EM] storeAd exception:', e);
      return { ok: false, error: e };
    }
  }

  /* ── Load all public ads from Supabase ── */
  async function loadAds() {
    try {
      const hdrs = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
      let r = await fetch(SB_URL + '/rest/v1/ads?select=*&order=created_at.desc&limit=500', { headers: hdrs });
      if (!r.ok) return [];
      const rows = await r.json();
      return rows.map(row => ({
        id: row.id,
        title: row.title || '',
        cat: row.cat || 'misc',
        price: Number(row.price) || 0,
        loc: row.loc || '',
        seller: row.seller || 'Unknown',
        sellerType: row.seller_type || 'private',
        desc: row.description || '',
        cond: row.cond || 'N/A',
        neg: !!row.neg,
        photos: Array.isArray(row.photos) ? row.photos : [],
        phone: row.phone || '',
        contactEmail: row.contact_email || '',
        verified: !!row.verified,
        postedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        isUserAd: true,
        badge: null,
        art: null,
        userId: row.user_id || null,
      }));
    } catch (_) { return []; }
  }

  /* ── Report an ad ── */
  async function reportAd(adId, adTitle, reason) {
    try {
      await fetch(SB_URL + '/rest/v1/reports', {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify({ ad_id: String(adId), ad_title: adTitle, reason: reason })
      });
    } catch (_) {}
  }

  /* ── Store a message in the events table ── */
  async function storeMessage(msg) {
    try {
      await fetch(SB_URL + '/rest/v1/events', {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify({ event_type: 'em_message', payload: msg, created_at: new Date().toISOString() })
      });
    } catch(_) {}
  }

  /* ── Load messages for a user (sent + received) ── */
  async function loadMessages(userEmail) {
    try {
      const enc = encodeURIComponent(userEmail);
      const hdrs = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
      const [r1, r2] = await Promise.all([
        fetch(SB_URL + '/rest/v1/events?event_type=eq.em_message&payload->>recipient_email=eq.' + enc + '&order=created_at.desc&limit=100', { headers: hdrs }),
        fetch(SB_URL + '/rest/v1/events?event_type=eq.em_message&payload->>sender_email=eq.' + enc + '&order=created_at.desc&limit=100', { headers: hdrs })
      ]);
      const received = r1.ok ? await r1.json() : [];
      const sent     = r2.ok ? await r2.json() : [];
      return { received, sent };
    } catch(_) { return { received: [], sent: [] }; }
  }

  /* ── Expose globals ── */
  window.emTrack        = track;
  window.emStoreAd      = storeAd;
  window.emReport       = reportAd;
  window.emLoadAds      = loadAds;
  /* ── Count views for a single ad ── */
  async function countAdViews(adId) {
    try {
      const r = await fetch(
        SB_URL + '/rest/v1/events?event_type=eq.ad_view&payload->>ad_id=eq.' + encodeURIComponent(String(adId)) + '&select=id',
        { headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY } }
      );
      if (!r.ok) return 0;
      const rows = await r.json();
      return Array.isArray(rows) ? rows.length : 0;
    } catch(_) { return 0; }
  }

  window.emStoreMessage = storeMessage;
  window.emLoadMessages = loadMessages;
  window.emCountViews   = countAdViews;

  track('page_view');
})();
