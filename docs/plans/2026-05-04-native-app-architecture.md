# Native iOS/Android App Architecture — Foundation + Pilot

**Status:** Queued. Not started.
**Branch (when work resumes):** `claude/native-app-architecture-g9Mhn`
**Estimated effort:** ~3–4 weeks

## Context

The platform serves only admin UIs today. Each site built on `@pandotic/universal-cms`
may eventually ship its own end-user iOS/Android app (per site, per audience). To
prove the architecture end-to-end without locking us in, we need:

1. An HTTP API surface a native client can consume — auth is currently cookie-only
   and admin-only; native clients can't use HttpOnly cookies the same way.
2. An RN-safe TypeScript SDK so consumer apps can talk to the same backend without
   re-implementing data fetching.
3. A working Expo pilot wrapping `apps/pandotic-site` to validate the full path.

### Decisions baked in

- **Audience:** end-user apps per site. NOT the Pandotic Hub, NOT App-Admin SaaS.
- **Runtime:** Expo (RN + expo-router). Capacitor noted as fallback only for
  content-only sites that don't need IAP or rich native nav.
- **Identity table:** pluggable per site via `cmsConfig.nativeApp.identityTable`.
  Each consumer chooses `'profiles'` (extend the admin role enum) or
  `'app_users'` (separate table). Pilot uses `'app_users'`.
- **IAP:** out of pilot scope. Ship the `app_entitlements` table + a Stripe
  webhook for web-purchase entitlements. RevenueCat / `expo-iap` / StoreKit
  loop deferred until a real customer needs it. The Expo app gets an
  `Entitlements` view but no purchase UI.
- **Web product unchanged.** Cookie auth keeps working; the Bearer path is
  additive.

## Scope

### Phase 0 — ADRs (Day 1)

Create `docs/adr/` (currently empty) and write four short ADRs:

- `docs/adr/0001-native-runtime-expo.md` — Expo over Capacitor. Rationale:
  native UI primitives, real `expo-notifications`, `expo-iap`/RevenueCat
  optionality, EAS dev/preview builds, decoupled from the Next bundle.
- `docs/adr/0002-dual-mode-auth.md` — Bearer-or-cookie resolver; refresh
  token rotation handled in cms-client (`set` after every `refresh()`).
- `docs/adr/0003-entitlements-provider-agnostic.md` — `app_entitlements`
  table with a `provider` discriminator; webhooks are the only writers;
  Stripe ships in pilot, RevenueCat/manual remain valid values.
- `docs/adr/0004-package-layout.md` — new `packages/cms-client` (RN-safe
  HTTP client, ESM+CJS) + new `apps/pandotic-app` (Expo). cms-core stays
  Next-leaning; new `react-native` conditional points to a slim
  types-only barrel.

### Phase 1 — API foundations (Days 2–6, in `template/` + `packages/cms-core`)

**1a. Dual-mode auth resolver in cms-core.**
- New `packages/cms-core/src/middleware/api-auth.ts` exporting
  `createAuthMiddleware({ cookieClient, bearerClient })` with `resolve` /
  `requireUser` / `requireAdmin`. Prefers `Authorization: Bearer <jwt>`,
  falls back to `@supabase/ssr` cookies.
- Refactor `packages/cms-core/src/middleware/auth.ts` `requireAdmin` to
  delegate to the new resolver while keeping its public signature unchanged
  so admin routes keep working.
- New `template/src/lib/supabase/bearer.ts` — `createBearerClient(token)`
  using `createClient(url, anon, { global: { headers: { Authorization: 'Bearer ' + token } } })`
  so RLS evaluates as the user.
- Re-export from `packages/cms-core/src/middleware/index.ts`.

**1b. CORS helper.**
- New `packages/cms-core/src/middleware/cors.ts` —
  `withCors(handler, allowedOrigins)` handles `OPTIONS` preflight + sets
  `Access-Control-Allow-*`. Default policy: allowlist from
  `cmsConfig.nativeApp.allowedOrigins`; opt-in `*` for unauthenticated reads
  via `nativeApp.publicReadCors: '*'`.

**1c. `cmsConfig` schema extension.**
Edit `packages/cms-core/src/config.ts` to add an optional `nativeApp` block to
`CmsConfig`:

```ts
nativeApp?: {
  enabled?: boolean;
  allowedOrigins: string[];
  publicReadCors?: '*' | 'allowlist';
  scheme?: string;
  bundleId?: { ios: string; android: string };
  identityTable: 'profiles' | 'app_users';
  push?: { provider: 'expo' | 'fcm-apns'; expoAccessToken?: string };
  entitlements?: { providers: Array<'stripe' | 'manual' | 'revenuecat'> };
};
```

Mirror an example (commented out) in `template/src/cms.config.ts`.

**1d. Migrations under `template/supabase/migrations/`.** Next free index is
`00042` (last applied is `00041_content_page_display_options.sql`).

- `00042_app_users.sql` — `app_users(id uuid PK, auth_user_id uuid UNIQUE FK
  auth.users, display_name, avatar_url, locale, marketing_opt_in bool,
  created_at, updated_at)`. RLS: owner-only select/update.
- `00043_device_tokens.sql` — `(id, user_id FK auth.users, device_id text,
  platform check in ('ios','android','web'), token, app_version, created_at,
  updated_at, UNIQUE(user_id, device_id))`. RLS: owner-only on all four ops.
- `00044_app_entitlements.sql` — `(id, user_id FK auth.users,
  entitlement_key, provider check in ('stripe','revenuecat','manual'),
  external_id, expires_at, metadata jsonb, UNIQUE(user_id, entitlement_key,
  provider))`. RLS: owner SELECT only — no user-facing write policies; service
  role writes via webhooks.

`scripts/validate-migrations.sh` cold-applies the directory in CI, so all three
get coverage automatically.

**1e. New cms-core data fns.**
- `packages/cms-core/src/data/app-users.ts` — `getOrCreateAppUser`,
  `updateAppUser`, `getAppUserByAuthId`. Adapter handles both `identityTable`
  modes.
- `packages/cms-core/src/data/devices.ts` — `registerDevice`, `deleteDevice`,
  `listDevicesForUser`.
- `packages/cms-core/src/data/entitlements.ts` — `listEntitlementsForUser`,
  `upsertEntitlement(adminClient, …)`, `revokeEntitlement(adminClient, …)`.
- Wire all three into `packages/cms-core/tsup.config.ts` `entry` map and
  `packages/cms-core/package.json` `exports` as `./data/app-users`,
  `./data/devices`, `./data/entitlements`.

**1f. `/api/v1/*` namespace.** New directory `template/src/app/api/v1/`. Each
route is a thin wrapper around a cms-core data fn, mirroring the existing
`template/src/app/api/admin/*` pattern. All non-webhook handlers wrapped with
`withCors(...)`.

| Route | Method | Auth | Backed by |
|---|---|---|---|
| `auth/signup/route.ts` | POST | none | `supabase.auth.signUp` + `getOrCreateAppUser` |
| `auth/login/route.ts` | POST | none | `supabase.auth.signInWithPassword` |
| `auth/refresh/route.ts` | POST | none | `supabase.auth.refreshSession` |
| `auth/logout/route.ts` | POST | bearer | `supabase.auth.signOut` |
| `auth/me/route.ts` | GET | bearer | `requireUser` → `{ user, appUser, entitlements }` |
| `blog/route.ts` | GET | optional | `getPublishedContentPages` (filter `page_type='blog'`) |
| `blog/[slug]/route.ts` | GET | optional | `getContentPageBySlug` |
| `directory/route.ts` | GET | optional | `getAllEntities` |
| `directory/[slug]/route.ts` | GET | optional | `getEntityBySlug` |
| `pages/[slug]/route.ts` | GET | optional | `getContentPageBySlug` |
| `forms/[slug]/submit/route.ts` | POST | optional | `createSubmission` (`packages/cms-core/src/data/forms.ts`) |
| `reviews/route.ts` | POST | bearer | `createReview` (`packages/cms-core/src/data/reviews.ts`) |
| `devices/route.ts` | POST | bearer | `registerDevice` |
| `devices/[id]/route.ts` | DELETE | bearer | `deleteDevice` |
| `entitlements/route.ts` | GET | bearer | `listEntitlementsForUser` |
| `webhooks/stripe/route.ts` | POST | Stripe-Signature | `upsertEntitlement` |

`webhooks/stripe/route.ts` verifies signature against `STRIPE_WEBHOOK_SECRET`
env, uses `createAdminClient()` (service role), and writes via
`upsertEntitlement`. Future RevenueCat webhook follows the same shape.

**1g. cms-core `react-native` conditional export.**
- Edit `packages/cms-core/package.json` `exports` map to add a `"react-native"`
  key on RN-safe entries (types + data fns only — never `./middleware`,
  `./security`, `./error-logging/server`, `./components/theme/server`, or
  `./admin*`).
- Add a new shorthand subpath `./client-safe` resolving to
  `packages/cms-core/src/client-safe.ts` re-exporting only types and data fn
  type signatures.
- Document in `packages/cms-core/README.md` that RN consumers MUST import from
  `@pandotic/universal-cms/types`, `@pandotic/universal-cms/data/*`, or
  `@pandotic/universal-cms/client-safe`.

### Phase 2 — `packages/cms-client` (Days 7–11)

New workspace package `packages/cms-client/` (`@pandotic/cms-client`).

- `package.json` — `name: "@pandotic/cms-client"`, ESM+CJS (Metro friendliness),
  `peerDependencies: { "@pandotic/universal-cms": "workspace:*" }` (types only).
  Same `publishConfig` GitHub Packages block as cms-core.
  `files: ["dist","src"]`. Add `.changeset/cms-client-initial.md` so first
  publish flows through the existing release pipeline.
- `tsup.config.ts` — `format: ['esm','cjs']`, `dts: true`, no Next externals.
- `src/client.ts` — `createCmsClient({ baseUrl, tokenStore, fetch? }):
  CmsClient`. Internal `request(path, init)` adds `Authorization: Bearer
  <access>` when present; on 401 calls `auth.refresh()` once and replays.
- `src/token-store.ts` — `interface TokenStore { get(): Promise<{access:
  string, refresh: string} | null>; set(v): Promise<void>; clear():
  Promise<void> }`. Ships `MemoryTokenStore` for tests. Refresh-token rotation
  persists via `set` after every refresh — covered by
  `__tests__/auth-refresh.test.ts`.
- `src/resources/{auth,blog,directory,pages,forms,reviews,devices,entitlements}.ts` —
  surface methods exactly mirroring `/api/v1/*`. Return types imported from
  `@pandotic/universal-cms/types`.
- `src/entitlements/index.ts` — `EntitlementProvider` interface +
  `createStripeProvider({ baseUrl })` (read-only on client). RevenueCat /
  manual stubs left as TODO with type signatures only.
- `src/theme.ts` — pure-JS `useThemeTokens(config)` returning a memoized
  `{ colors, spacing, fonts }` map suitable for RN `StyleSheet`. No RN
  imports.
- `src/index.ts` — barrel.
- `__tests__/` — vitest covering: signed/unsigned request, 401 refresh-and-retry,
  refresh-token rotation persistence, token-store contract.

CI: add `pnpm --filter @pandotic/cms-client {build,test}` to
`.github/workflows/ci.yml` `validate` job.

### Phase 3 — `apps/pandotic-app` Expo pilot (Days 12–18)

New workspace app `apps/pandotic-app/`. Expo SDK ~52, RN 0.76, expo-router,
TypeScript strict.

Top-level files:
- `package.json` — Expo + `expo-router`, `expo-secure-store`,
  `expo-notifications`, `expo-image`, `@pandotic/cms-client: workspace:*`,
  `@pandotic/universal-cms: workspace:*` (types only).
- `app.config.ts` — reads `./cms.config.ts` to derive `name`, `slug`, `scheme`,
  `ios.bundleIdentifier`, `android.package`, `icon`, `splash`. Wires
  `expo-router`, `expo-notifications`, `expo-secure-store` plugins.
- `cms.config.ts` — extends `apps/pandotic-site/src/cms.config.ts`, overlays
  `mobile: { iconPath, splashPath, accentColor, bundleId, scheme }`.
- `metro.config.js` — pnpm workspace `nodeModulesPaths` + `watchFolders` (Metro
  pitfall in monorepos).
- `babel.config.js` — standard Expo preset.
- `tsconfig.json` — strict, no DOM lib.
- `.env.example` — `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`.
- `.eslintrc.cjs` — `no-restricted-imports` blocking
  `@pandotic/universal-cms/data/hub-*`, `@pandotic/universal-cms/middleware`,
  `@pandotic/universal-cms/security`,
  `@pandotic/universal-cms/error-logging/server` (RN bundle weight guard).

`app/` (expo-router file-based):
- `app/_layout.tsx` — root provider; instantiates `cmsClient` with
  `SecureStoreTokenStore`; provides via React context.
- `app/(tabs)/_layout.tsx` — tab nav: Home, Blog, Directory, Account.
- `app/(tabs)/index.tsx` — home, calls `client.blog.list({ limit: 10 })`.
- `app/(tabs)/blog/index.tsx`, `app/(tabs)/blog/[slug].tsx`.
- `app/(tabs)/directory/index.tsx`, `app/(tabs)/directory/[slug].tsx`.
- `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`.
- `app/(account)/index.tsx` — entitlements (read-only) + registered devices +
  sign-out. **No purchase UI** (deferred per pilot scope).

Native integration:
- `lib/secure-token-store.ts` — implements `TokenStore` over
  `expo-secure-store`.
- `lib/push.ts` — registers for notifications post-login, calls
  `client.devices.register(...)`.
- `lib/theme.tsx` — wraps cms-client `useThemeTokens` for RN.

Universal links: `template/public/.well-known/apple-app-site-association` +
`assetlinks.json` generated from `cmsConfig.nativeApp.bundleId`. Add a
`template/next.config.ts` rewrite if Netlify needs the `.well-known` path.

EAS: `apps/pandotic-app/eas.json` with `development` and `preview` profiles
only — no `production` / `submit` profile in this scope.

### Phase 4 — Docs + verification (rolled in throughout, sealed Days 19–20)

- `docs/native-apps/README.md` — architecture overview + per-site adoption
  checklist (set `nativeApp.allowedOrigins`, run migrations 00042–00044,
  configure Stripe webhook secret, copy the Expo template).
- `docs/native-apps/adoption-guide.md` — step-by-step for an existing consumer
  site to enable the API tier.
- `docs/native-apps/smoke.md` — manual e2e checklist (below).
- CI: extend `.github/workflows/ci.yml` `validate` job with cms-client
  build+test and `pnpm --filter pandotic-app typecheck`. Expo build itself is
  skipped in CI (too heavy) — covered by EAS dev builds.

## Critical files to modify or create

**Modify:**
- `packages/cms-core/src/config.ts` — add `nativeApp` to `CmsConfig`
- `packages/cms-core/src/middleware/auth.ts` — refactor `requireAdmin` to
  delegate to new resolver
- `packages/cms-core/src/middleware/index.ts` — re-export `api-auth` + `cors`
- `packages/cms-core/package.json` — add `react-native` conditional +
  `./client-safe`, `./data/app-users`, `./data/devices`, `./data/entitlements`
- `packages/cms-core/tsup.config.ts` — new entries
- `template/src/cms.config.ts` — example `nativeApp` block (commented)
- `.github/workflows/ci.yml` — add cms-client + pandotic-app validation steps

**Create:**
- `docs/adr/0001-native-runtime-expo.md` (+ 0002–0004)
- `packages/cms-core/src/middleware/api-auth.ts`
- `packages/cms-core/src/middleware/cors.ts`
- `packages/cms-core/src/client-safe.ts`
- `packages/cms-core/src/data/{app-users,devices,entitlements}.ts`
- `template/src/lib/supabase/bearer.ts`
- `template/supabase/migrations/00042_app_users.sql`
- `template/supabase/migrations/00043_device_tokens.sql`
- `template/supabase/migrations/00044_app_entitlements.sql`
- `template/src/app/api/v1/...` (full tree per the table above)
- `packages/cms-client/` (new package — see Phase 2 file list)
- `apps/pandotic-app/` (new Expo app — see Phase 3 file list)
- `docs/native-apps/{README,adoption-guide,smoke}.md`

## Reused functions and patterns

- `packages/cms-core/src/data/forms.ts` `createSubmission` →
  `/api/v1/forms/[slug]/submit`
- `packages/cms-core/src/data/reviews.ts` `createReview` → `/api/v1/reviews`
- `packages/cms-core/src/data/content-pages.ts` `getPublishedContentPages`,
  `getContentPageBySlug` → `/api/v1/blog`, `/api/v1/pages/[slug]`
- `packages/cms-core/src/data/entities.ts` `getAllEntities`, `getEntityBySlug`
  → `/api/v1/directory`
- `packages/cms-core/src/middleware/auth.ts` `requireAdmin` pattern (existing)
  — new `requireUser` mirrors its shape
- Existing `template/src/app/api/admin/*/route.ts` route layout — `/api/v1/*`
  mirrors it 1:1
- Changeset + GitHub Packages release pipeline
  (`.github/workflows/release.yml`) — `@pandotic/cms-client` reuses unchanged

## Verification

End-to-end smoke (manual, captured in `docs/native-apps/smoke.md`):

1. `pnpm --filter @pandotic/universal-cms build && pnpm --filter @pandotic/cms-client build`
2. Apply migrations 00042–00044 to a local Supabase project; set
   `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` for `apps/pandotic-site`.
3. `pnpm --filter pandotic-site dev` — site running on `http://localhost:3000`
   with `/api/v1/*` enabled (gate via `cmsConfig.nativeApp.enabled = true`).
4. `curl http://localhost:3000/api/v1/blog` — returns blog list, no 401.
5. `pnpm --filter pandotic-app start` — Expo dev server. Open in iOS simulator.
6. In the app: sign up → land on home → tab Blog → tap a post → tab Directory
   → tap an entity → submit a form on a content page → tab Account → see
   registered device + empty entitlements list → sign out.
7. Trigger a Stripe webhook via `stripe trigger checkout.session.completed`
   (CLI) → re-open Account tab → see new entitlement row.

CI:
- `validate` builds cms-core, cms-client, types pandotic-app.
- `migrations` cold-applies 00042–00044 against the Postgres service container;
  passes if all three apply cleanly.
- cms-client tests cover auth-refresh + token-store contract.

## Open questions to resolve when work starts

1. **Push provider default.** Expo Push Service is fastest to ship but proxies
   through Expo's servers; FCM/APNs direct is more enterprise-friendly. Pilot
   uses Expo Push; revisit if a customer needs direct.
2. **CORS scope for unauthenticated reads.** Allowlist by default; `*` opt-in
   via `nativeApp.publicReadCors` if a customer's site is also consumed by a
   third-party widget.
3. **Webhook secret storage.** `STRIPE_WEBHOOK_SECRET` env on the consumer
   site's Netlify project for pilot. Move to a `cms_secrets` table later if
   multiple webhooks proliferate.
4. **cms-core RN bundle weight.** cms-core has ~100 export entries. The
   `react-native` conditional plus `no-restricted-imports` lint in
   `apps/pandotic-app` is the guardrail; revisit if bundle size grows.

## Out of scope (explicit)

- App Store / Play Store submission and provisioning
- RevenueCat / `expo-iap` / StoreKit transaction loop (entitlements table is
  ready; flip the switch when a customer needs IAP)
- Push notification production servers (Expo Push is the pilot path; FCM/APNs
  direct deferred)
- Capacitor wrap (documented as fallback in ADR-0001 only)
- Per-customer Stripe product configuration
- Migrating Hub or App-Admin to native (different audiences, separate decision
  later)
