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

  /* ── Ad moderation: store lightweight ad record when posted ── */
  async function storeAd(listing) {
    try {
      await fetch(SB_URL + '/rest/v1/ads', {
        method: 'POST',
        headers: sbHeaders(),
        body: JSON.stringify({
          id: String(listing.id),
          title: listing.title,
          cat: listing.cat,
          price: listing.price,
          loc: listing.loc,
          seller: listing.seller,
          created_at: new Date(listing.postedAt || Date.now()).toISOString()
        })
      });
    } catch (_) {}
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

  /* ── Expose globals ── */
  window.emTrack  = track;
  window.emStoreAd = storeAd;
  window.emReport  = reportAd;

  track('page_view');
})();
