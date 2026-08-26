/* GET /api/admin-store-document?path=...
   Admin-only private storage viewer for CIPC certificates uploaded with a
   store application.
*/
'use strict';
const https = require('https');
const { requireAdmin } = require('./_admin-auth');

const SB_URL  = (process.env.SUPABASE_URL || 'https://jucphfbaueowzlbjhxmm.supabase.co').replace(/\/$/, '');
const SB_HOST = SB_URL.replace('https://', '');
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  if (!SB_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const rawPath = String(req.query?.path || '').trim();
  const safePath = rawPath.replace(/\.\./g, '').replace(/^\//, '');
  if (!safePath || !safePath.includes('/')) return res.status(400).json({ error: 'path required' });

  const encodedPath = safePath.split('/').map(encodeURIComponent).join('/');
  const storageReq = https.request({
    hostname: SB_HOST,
    path: `/storage/v1/object/store-documents/${encodedPath}`,
    method: 'GET',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  }, storageRes => {
    if (storageRes.statusCode !== 200) {
      let raw = '';
      storageRes.on('data', d => raw += d);
      storageRes.on('end', () => res.status(404).json({ error: 'File not found' }));
      return;
    }

    res.setHeader('Content-Type', storageRes.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    storageRes.pipe(res);
  });
  storageReq.on('error', () => res.status(502).json({ error: 'Could not fetch store document' }));
  storageReq.end();
};
