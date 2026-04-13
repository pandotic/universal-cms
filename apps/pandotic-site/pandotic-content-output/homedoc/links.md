---
section: 14
title: "Links, Demo, and Access Notes"
project: "homedoc"
status: draft
generated: "2026-04-07T00:00:00Z"
---

# HomeDoc — Links, Demo, and Access Notes

## URLs

| Type | URL | Status |
|------|-----|--------|
| **Production** | Deployed via Netlify from `main` branch | URL not confirmed — check Netlify dashboard |
| **Staging** | Deployed via Netlify from `staging` branch | URL not confirmed — check Netlify dashboard |
| **Local Dev** | http://localhost:5173 | Run `npm run dev` |
| **Supabase Dashboard** | Project-specific Supabase URL | Check `.env` for `VITE_SUPABASE_URL` |

## Demo Access

- **Demo credentials:** Not confirmed. Check Supabase dashboard for demo user accounts or `demoHomeService.ts` for demo data setup.
- **Demo organization:** The codebase references a demo organization pre-loaded with test data (see `src/lib/database/demoHomeService.ts`).
- **Public-facing widgets:** Widget routes (`/widgets/*`) work without authentication and can be demonstrated with just a ZIP code or address.

## What Can Be Shared Publicly

- **Calculator widgets** — No authentication needed, all client-side, safe to share
- **Risk assessment widgets** — Require address/ZIP, no auth, safe to share
- **Water safety widget** — ZIP-code only, no auth, safe to share
- **TCO calculator** — No auth, all client-side, safe to share
- **Onboarding flow** — Requires account creation, shows Street View and RentCast auto-fill
- **Full app** — Requires account and home setup

## What Should NOT Be Shared

- API keys or Supabase credentials
- Admin panel screenshots showing real API credentials
- User data from production accounts
- Internal cost tracking or usage data

## Environment Requirements

To run the full experience locally:
1. `.env` file with Supabase project URL and anon key (required)
2. Google Maps API key (for address autocomplete, Street View, solar analysis)
3. RentCast API key (for property auto-fill during onboarding)
4. Gemini API key (for document extraction — set as Supabase secret, not VITE_ var)
5. Additional optional keys: HomeSpy, Unstructured, Resend, OpenEI

See `.env.example` for the full variable list.
