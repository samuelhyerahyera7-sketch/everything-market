/* Photo proxy — serves public ad photos from Supabase Storage through
   Vercel's CDN with a 1-year cache. Each photo is fetched from Supabase
   roughly once per CDN region instead of once per visitor, which keeps us
   inside Supabase's egress quota.
   Public URL: /img/<path>  (rewritten to /api/photo?p=<path> in vercel.json)
*/
const https = require('https');

const SB_URL = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');

module.exports = function handler(req, res) {
  const p = String((req.query && req.query.p) || '');
  if (!p || p.includes('..') || !/^[A-Za-z0-9._\-\/]+$/.test(p)) {
    return res.status(400).send('Bad path');
  }
  const url = SB_URL + '/storage/v1/object/public/ad-photos/' + p;

  https.get(url, upstream => {
    const status = upstream.statusCode || 502;
    if (status !== 200) {
      upstream.resume();
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(status === 404 ? 404 : 502).send('Photo unavailable');
    }
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'image/jpeg');
    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.status(200);
    upstream.pipe(res);
  }).on('error', () => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).send('Photo unavailable');
  });
};
