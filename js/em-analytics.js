/* ── EverythingMarket Analytics (Supabase — stats only, no PII) ── */
(function () {
  const SB_URL = 'https://jucphfbaueowzlbjhxmm.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y3BoZmJhdWVvd3psYmpoeG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MTc5ODIsImV4cCI6MjEwMTQ5Mzk4Mn0.e6qDIPOSs4zJVUM6MX9kJ7cim8WTGgmiCzWSdl6wNdw';

  const queue = [];
  let timer = null;

  function track(type, payload) {
    queue.push({
      event_type: type,
      payload: payload || null,
      created_at: new Date().toISOString()
    });
    /* flush when batch hits 10 or schedule a flush in 45 seconds */
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
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(batch)
      });
    } catch (_) { /* stats are non-critical — fail silently */ }
  }

  /* flush when tab goes background / user closes */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  /* expose globally so other scripts can call window.emTrack(...) */
  window.emTrack = track;

  /* track the page view immediately */
  track('page_view');
})();
