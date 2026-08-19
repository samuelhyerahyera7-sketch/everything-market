/* GET /api/load-stores — returns approved stores with listing counts */
import { createClient } from '@supabase/supabase-js';

const _sb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  const sb = _sb();

  /* Fetch approved store applications */
  const { data: stores, error } = await sb
    .from('store_applications')
    .select('user_id, store_name, store_description, store_type, approved_at')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false });

  if (error) {
    console.error('[load-stores]', error);
    return res.status(500).json({ error: 'Failed to load stores' });
  }

  if (!stores || !stores.length) return res.json([]);

  /* Get listing counts per user */
  const userIds = stores.map(s => s.user_id);
  const { data: ads } = await sb
    .from('ads')
    .select('user_id, loc')
    .in('user_id', userIds);

  const countMap = {};
  const locMap   = {};
  (ads || []).forEach(a => {
    countMap[a.user_id] = (countMap[a.user_id] || 0) + 1;
    if (a.loc && !locMap[a.user_id]) locMap[a.user_id] = a.loc;
  });

  return res.json(stores.map(s => ({
    userId:      s.user_id,
    storeName:   s.store_name,
    description: s.store_description || '',
    storeType:   s.store_type || 'retail',
    count:       countMap[s.user_id] || 0,
    loc:         locMap[s.user_id]   || '',
    approvedAt:  s.approved_at
  })));
}
