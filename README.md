# Everything Market

Static marketplace front end with Vercel serverless API routes for Supabase-backed ads, users, shops, verification, payments, and notifications.

## Local Structure

- `index.html` - public marketplace page.
- `admin.html` - admin dashboard.
- `css/` - site styles.
- `js/` - browser-side marketplace logic and analytics.
- `api/` - Vercel serverless functions.
- `supabase*.sql` - database setup and repair scripts.
- `supabase/functions/` - Supabase edge functions.

## Required Environment Variables

Configure these in Vercel for production:

- `ADMIN_SECRET` - admin dashboard password. Do not commit the value.
- `ADMIN_SESSION_SECRET` - optional HMAC signing secret for admin sessions. Falls back to `SUPABASE_SERVICE_KEY` if omitted.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`

Optional integrations used by some API routes:

- `RESEND_API_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_PUBLIC_KEY`
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_SANDBOX`
- `META_WHATSAPP_BUSINESS_NUMBER`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_APP_SECRET`
- `BIOMETRIC_API_URL`
- `BIOMETRIC_JWT_SECRET`

## Admin Security

The admin password is not stored in `admin.html`. Admin login posts to `/api/admin-login`, which verifies `ADMIN_SECRET` server-side and returns a short-lived bearer token. Privileged admin APIs require that token.

Rotate `ADMIN_SECRET` if an old admin password was ever exposed in a browser bundle or public commit history.
