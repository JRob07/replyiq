# ReplyIQ update package

This package includes direct code updates for the ReplyIQ app.

## Completed in this pass

- Premium light-theme redesign across landing, auth, dashboard, billing, settings, modal, upgrade banner, and review actions.
- Fixed billing portal route path: `/api/billing/portal`.
- Hardened Stripe webhook route and removed the malformed extra brace from the previous webhook file.
- Kept Stripe checkout route with Starter/Pro/Agency support and visible error handling.
- Added delete review endpoint.
- Added generate/regenerate review response endpoint with backwards-compatible `reviewId` and `review_id` payload support.
- Added Resend email helper and new-review notification support.
- Added account settings page at `/dashboard/settings`.
- Added Google Business Profile OAuth/sync scaffolding:
  - `/api/integrations/google/connect`
  - `/api/integrations/google/callback`
  - `/api/integrations/google/locations`
  - `/api/integrations/google/sync`
- Added Supabase migration for Google integrations and external review IDs:
  - `supabase/migrations/20260427_replyiq_phase2_google.sql`
- Added `.env.example` with the required environment variables.
- Removed misplaced duplicate routes/files from the project.

## Required before Google Business Profile sync works

1. Run the SQL migration in Supabase.
2. Add these Vercel environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
3. In Google Cloud, add this OAuth redirect URI:
   - `https://replyiq-eight.vercel.app/api/integrations/google/callback`
4. Enable/request access to the required Google Business Profile APIs.
5. Connect Google from the dashboard Google automation card.
6. Click Sync reviews.

## Required before email notifications work

1. Add `RESEND_API_KEY` in Vercel.
2. Add `RESEND_FROM_EMAIL` in Vercel.
3. Verify your sending domain in Resend for production sending.

## Build note

I attempted to run a full local dependency install/build in the sandbox, but dependency installation did not complete in the available environment. I still performed a code-level cleanup, removed known broken route paths, and corrected the malformed webhook file.
