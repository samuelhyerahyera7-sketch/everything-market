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

  /* ── Upload a single photo via server endpoint (uses service key, always works) ── */
  async function _uploadPhoto(adId, index, dataUrl) {
    try {
      const r = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, index, dataUrl })
      });
      if (!r.ok) { console.error('[EM] upload-photo', r.status); return null; }
      const json = await r.json();
      return json.url || null;
    } catch (e) { console.error('[EM] upload-photo exception', e); return null; }
  }

  /* ── Store full ad: upload photos, then insert row ── */
  async function storeAd(listing) {
    const folderKey = String(listing.id);
    const photoUrls = [];
    if (Array.isArray(listing.photos) && listing.photos.length) {
      console.log('[EM] storeAd: uploading', listing.photos.length, 'photo(s)...');
      for (let i = 0; i < listing.photos.length; i++) {
        const url = await _uploadPhoto(folderKey, i, listing.photos[i]);
        if (url) photoUrls.push(url);
      }
      console.log('[EM] storeAd: uploaded', photoUrls.length, '/', listing.photos.length, 'photos');
    }

    const payload = {
      id:            listing.id ? Number(listing.id) : undefined,
      title:         listing.title,
      cat:           listing.cat,
      price:         listing.price,
      loc:           listing.loc,
      seller:        listing.seller,
      seller_type:   listing.sellerType || 'private',
      description:   listing.desc || '',
      cond:          listing.cond || 'N/A',
      neg:           listing.neg || false,
      photos:        photoUrls,
      phone:         listing.phone || '',
      contact_email: listing.contactEmail || '',
      verified:      false
    };
    if (!payload.id) delete payload.id;
    if (listing.userId) payload.user_id = listing.userId;

    /* Try server-side endpoint first — uses service key, bypasses RLS INSERT restrictions */
    async function _doInsertViaAPI(p) {
      try {
        console.log('[EM] _doInsertViaAPI: posting to /api/store-ad...');
        const r = await fetch('/api/store-ad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        const json = await r.json();
        if (!r.ok) {
          console.error('[EM] _doInsertViaAPI: HTTP', r.status, json.error || r.statusText);
          return { ok: false, error: { message: json.error || r.statusText, status: r.status }, data: null };
        }
        console.log('[EM] _doInsertViaAPI: success');
        return { ok: true, data: [{}] };
      } catch (e) {
        console.error('[EM] _doInsertViaAPI: exception', String(e));
        return { ok: false, error: { message: String(e) }, data: null };
      }
    }

    /* Fallback: direct Supabase insert using the user's authenticated session */
    async function _doInsertDirect(p) {
      if (window._sb) {
        console.log('[EM] _doInsertDirect: inserting via Supabase JS client...');
        /* Use insert() without .select() — minimal return avoids false-positives
           caused by RLS SELECT policies blocking the read-back of the new row. */
        const { error } = await window._sb.from('ads').insert(p);
        if (error) {
          console.error('[EM] _doInsertDirect: error', error.code, error.message, error.details);
          return { ok: false, error, data: null };
        }
        console.log('[EM] _doInsertDirect: success');
        return { ok: true, data: [{}] };
      }
      console.log('[EM] _doInsertDirect: no _sb client, using raw fetch...');
      const r = await fetch(SB_URL + '/rest/v1/ads', {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + authToken,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(p)
      });
      if (!r.ok) {
        const txt = await r.text();
        console.error('[EM] _doInsertDirect: fetch error', r.status, txt);
        return { ok: false, error: { message: txt, status: r.status }, data: null };
      }
      console.log('[EM] _doInsertDirect: raw fetch success');
      return { ok: true, data: [{}] };
    }

    let result = await _doInsertViaAPI(payload);
    if (!result.ok) {
      console.warn('[EM] storeAd: server insert failed, trying direct Supabase insert...');
      result = await _doInsertDirect(payload);
    }

    /* One retry after 2 s if both paths failed */
    if (!result.ok) {
      console.warn('[EM] storeAd: attempt 1 failed — retrying in 2s...');
      await new Promise(r => setTimeout(r, 2000));
      result = await _doInsertViaAPI(payload);
      if (!result.ok) result = await _doInsertDirect(payload);
    }

    if (!result.ok) {
      const err = result.error;
      console.error('[EM] storeAd FAILED (code=%s status=%s): %s | details: %s',
        err?.code, err?.status, err?.message, err?.details);
      return { ok: false, error: err };
    }

    console.log('[EM] storeAd: ad stored successfully');
    return { ok: true };
  }

  /* ── Map a raw Supabase ads row to the app's listing shape ── */
  function _rowToListing(row) {
    return {
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
      isUserAd: !!row.user_id,
      badge: null,
      art: null,
      userId: row.user_id || null,
      sponsored: !!row.sponsored,
      sponsoredUntil: row.sponsored_until ? new Date(row.sponsored_until).getTime() : null,
    };
  }

  /* ── Load all public ads from Supabase ── */
  async function loadAds() {
    /* Try server-side endpoint first — uses service key, bypasses SELECT RLS,
       so every visitor sees every ad regardless of Supabase policies. */
    try {
      const r = await fetch('/api/load-ads');
      if (r.ok) {
        const rows = await r.json();
        if (Array.isArray(rows)) {
          console.log('[EM] loadAds: server endpoint returned', rows.length, 'ads');
          return rows.map(_rowToListing);
        }
      } else {
        console.warn('[EM] loadAds: server endpoint returned', r.status, '— falling back to direct query');
      }
    } catch (e) {
      console.warn('[EM] loadAds: server endpoint unavailable —', e.message, '— falling back');
    }

    /* Fallback: direct Supabase query (subject to RLS SELECT policies) */
    if (window._sb) {
      const { data, error } = await window._sb
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) {
        console.error('[EM] loadAds direct error:', error.code, error.message);
        if (error.code === '42501' || error.message.includes('policy')) {
          console.warn('[EM] Fix: Supabase → Table Editor → ads → RLS → add SELECT policy: allow anon with USING (true)');
        }
        return null;
      }
      return (data || []).map(_rowToListing);
    }

    try {
      const hdrs = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
      const r = await fetch(SB_URL + '/rest/v1/ads?select=*&order=created_at.desc&limit=500', { headers: hdrs });
      if (!r.ok) {
        const errText = await r.text();
        console.error('[EM] loadAds HTTP error:', r.status, errText);
        return null;
      }
      const rows = await r.json();
      return rows.map(_rowToListing);
    } catch (e) {
      console.error('[EM] loadAds exception:', e);
      return null;
    }
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

  /* ── Load messages via server endpoint (bypasses RLS) ── */
  async function loadMessages(userEmail) {
    try {
      const r = await fetch('/api/load-messages?email=' + encodeURIComponent(userEmail));
      if (r.ok) return await r.json();
      return { received: [], sent: [] };
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
