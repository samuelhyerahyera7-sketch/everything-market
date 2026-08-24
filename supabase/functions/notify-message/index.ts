import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { fromName, fromEmail, listingTitle, listingId, body, sellerEmail } = await req.json();

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_KEY) return new Response('Missing key', { status: 500, headers: CORS });

    // Always notify the site owner; also notify seller if their email is known
    const recipients = ['everythingmarket48@gmail.com', 'samuelhyera.hyera7@gmail.com'];
    if (sellerEmail && !recipients.includes(sellerEmail)) {
      recipients.push(sellerEmail);
    }

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#1B4332;margin-bottom:4px;">New message on Everything Market</h2>
        <p style="color:#666;margin-bottom:20px;">Someone is interested in your listing.</p>
        <div style="background:#F5F5F5;border-radius:8px;padding:16px;margin-bottom:20px;">
          <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Listing</div>
          <div style="font-weight:700;color:#111;">${listingTitle}</div>
          <div style="font-size:12px;color:#888;margin-top:4px;">Ad #${listingId}</div>
        </div>
        <div style="background:#fff;border:1.5px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:20px;">
          <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Message from ${fromName}${fromEmail ? ` &lt;${fromEmail}&gt;` : ''}</div>
          <div style="color:#111;line-height:1.6;">${body.replace(/\n/g, '<br>')}</div>
        </div>
        ${fromEmail ? `<a href="mailto:${fromEmail}" style="display:inline-block;background:#1B4332;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Reply to Buyer</a>` : ''}
        <p style="font-size:11px;color:#aaa;margin-top:24px;">Everything Market · everythingmarket48@gmail.com</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Everything Market <onboarding@resend.dev>',
        to: recipients,
        subject: `New message about: ${listingTitle}`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
