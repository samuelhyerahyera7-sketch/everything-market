# Everything Market Verification Service Setup

Everything Market is ready for the open-source `biometrical-verify` service, but that service must run on a Docker host because it needs a FastAPI API, worker, Postgres, Redis, and MinIO.

Repository:
https://github.com/asalazarvaldiviaocg/biometrical-verify

## Required Everything Market Vercel Variables

Set these in the `everything-market` Vercel project for Production and Preview:

```txt
BIOMETRIC_API_URL=https://your-verification-service-domain.example
BIOMETRIC_JWT_SECRET=the-same-secret-used-by-biometrical-verify
META_WHATSAPP_BUSINESS_NUMBER=27xxxxxxxxx
META_WEBHOOK_VERIFY_TOKEN=your-meta-webhook-verify-token
META_APP_SECRET=your-meta-app-secret
```

Already configured:

```txt
SUPABASE_SERVICE_KEY
ADMIN_SECRET
ADMIN_SESSION_SECRET
```

## Meta WhatsApp Webhook

Use this callback URL in Meta:

```txt
https://www.everythingmarket.co.za/api/whatsapp-webhook
```

The verify token in Meta must exactly match `META_WEBHOOK_VERIFY_TOKEN` in Vercel.

## Verification Rules

The public `Verified Seller` badge requires:

- confirmed email
- verified mobile number
- approved ID/selfie verification

Admin manual approval can also mark a seller verified after offline checks.

## Admin Readiness Check

Open `/admin`, go to `Users`, then click `Verification Setup`.

It checks:

- Vercel env vars
- Supabase verification tables
- `biometric-temp` storage bucket
- biometric service `/healthz`
- biometric service `/readyz`
