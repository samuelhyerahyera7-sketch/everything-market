/* POST /api/apply-store — submit a store application */
import { createClient } from '@supabase/supabase-js';

const _sb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers.authorization || '';
  const jwt  = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) return res.status(401).json({ error: 'Not authenticated' });

  /* Verify the user's JWT */
  const sbAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
  const { data: { user }, error: authErr } = await sbAnon.auth.getUser();
  if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { store_name, store_description, store_type } = req.body || {};
  if (!store_name?.trim()) return res.status(400).json({ error: 'Store name is required' });

  const sb = _sb();

  /* Check for existing application */
  const { data: existing } = await sb
    .from('store_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({
      error: existing.status === 'approved'
        ? 'Your store is already approved.'
        : existing.status === 'pending'
        ? 'You already have a pending application.'
        : 'Your previous application was rejected. Contact support.'
    });
  }

  const { error: insertErr } = await sb
    .from('store_applications')
    .insert({
      user_id: user.id,
      user_email: user.email,
      store_name: store_name.trim(),
      store_description: (store_description || '').trim(),
      store_type: store_type || 'retail',
      status: 'pending'
    });

  if (insertErr) {
    console.error('[apply-store]', insertErr);
    return res.status(500).json({ error: 'Could not submit application' });
  }

  /* Email admin */
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'noreply@everythingmarket.co.za',
          to: 'admin@everythingmarket.co.za',
          subject: `New Store Application: ${store_name.trim()}`,
          html: `<h2>New Store Application</h2>
            <p><strong>Store Name:</strong> ${store_name.trim()}</p>
            <p><strong>Applicant Email:</strong> ${user.email}</p>
            <p><strong>Store Type:</strong> ${store_type || 'retail'}</p>
            <p><strong>Description:</strong> ${(store_description || '').trim() || '(none)'}</p>
            <hr>
            <p>Review this application in the <a href="https://everythingmarket.co.za/admin">admin panel</a>.</p>`
        })
      });
    } catch (e) {
      console.error('[apply-store] email error', e);
    }
  }

  return res.status(200).json({ ok: true });
}
