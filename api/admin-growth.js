const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL_RAW = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL_RAW.replace('https://', '');
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

function sbGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path,
      method: 'GET',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Accept: 'application/json',
      },
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

/* Exact row count for an event_type, all-time — via PostgREST's count=exact
   with a 0-row page, so this never transfers the underlying rows. This is
   the number that only ever goes up, unlike the rolling 30-day totals. */
function sbCount(eventType) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SB_HOST,
      path: '/rest/v1/events?event_type=eq.' + encodeURIComponent(eventType) + '&select=id',
      method: 'GET',
      headers: {
        apikey: SB_KEY,
        Authorization: 'Bearer ' + SB_KEY,
        Accept: 'application/json',
        Prefer: 'count=exact',
        Range: '0-0',
      },
    }, res => {
      res.on('data', () => {});
      res.on('end', () => {
        const range = res.headers['content-range'] || '';
        const total = Number(range.split('/')[1]);
        resolve(Number.isFinite(total) ? total : 0);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function inc(map, key, by = 1) {
  if (!key) return;
  map[key] = (map[key] || 0) + by;
}

function top(map, limit = 10) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
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
    const since = daysAgo(30).toISOString();
    const path = '/rest/v1/events?created_at=gte.' + encodeURIComponent(since) +
      '&order=created_at.desc&limit=5000&select=event_type,created_at,payload';
    const [r, allTimePageViews, allTimeAdViews, allTimeMessages, allTimePosts] = await Promise.all([
      sbGet(path),
      sbCount('page_view').catch(() => 0),
      sbCount('ad_view').catch(() => 0),
      sbCount('em_message').catch(() => 0),
      sbCount('ad_post').catch(() => 0),
    ]);
    if (r.status !== 200) return res.status(502).json({ error: 'DB error ' + r.status, detail: r.body });

    const rows = JSON.parse(r.body || '[]');
    const today = dayKey(new Date());
    const last7 = daysAgo(7);
    const byDay = {};
    const byType = {};
    const adViews = {};
    const searches = {};
    const categories = {};
    const outreachEvents = {};
    let pageViews30d = 0;
    let pageViewsToday = 0;
    let adViews30d = 0;
    let messages30d = 0;
    let posts30d = 0;
    let searches30d = 0;
    let conversions30d = 0;
    let recent7Views = 0;
    let previous7Views = 0;

    rows.forEach(row => {
      const type = row.event_type || 'unknown';
      const created = new Date(row.created_at);
      const payload = row.payload || {};
      const day = dayKey(created);
      inc(byType, type);
      inc(byDay, day);

      if (type === 'page_view') {
        pageViews30d += 1;
        if (day === today) pageViewsToday += 1;
        if (created >= last7) recent7Views += 1;
        else if (created >= daysAgo(14)) previous7Views += 1;
      }
      if (type === 'ad_view') {
        adViews30d += 1;
        inc(adViews, payload.ad_id || payload.id);
        inc(categories, payload.cat);
      }
      if (type === 'search') {
        searches30d += 1;
        inc(searches, String(payload.q || '').toLowerCase().trim());
      }
      if (type === 'em_message') messages30d += 1;
      if (type === 'ad_post') posts30d += 1;
      if (['register', 'contact_form', 'advertise_enquiry', 'career_application', 'em_message', 'ad_post'].includes(type)) {
        conversions30d += 1;
      }
      if (['contact_form', 'advertise_enquiry', 'career_application', 'scam_report'].includes(type)) {
        inc(outreachEvents, type);
      }
    });

    const growthRate = previous7Views
      ? Math.round(((recent7Views - previous7Views) / previous7Views) * 100)
      : (recent7Views ? 100 : 0);

    return res.status(200).json({
      totals: {
        pageViews30d,
        pageViewsToday,
        adViews30d,
        messages30d,
        posts30d,
        searches30d,
        conversions30d,
        recent7Views,
        previous7Views,
        growthRate,
        allTimePageViews,
        allTimeAdViews,
        allTimeMessages,
        allTimePosts,
      },
      byDay,
      byType,
      topAds: top(adViews),
      topSearches: top(searches),
      topCategories: top(categories),
      outreachEvents,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
};
