---
name: google-oauth-supabase
description: |
  Set up Google OAuth sign-in for any Supabase project end-to-end.
  Use when asked about: Google OAuth, Google sign-in, social auth with Supabase,
  signInWithOAuth, OAuth consent screen, Google Cloud OAuth credentials,
  Supabase auth providers, "Continue with Google" button, magic link + Google,
  or any request to add Google login to a Supabase-powered app.
  Covers: GCP project creation, OAuth consent screen, web client credentials,
  Supabase provider config, frontend button code, config.toml local dev setup.
user-invocable: true
---

# Google OAuth + Supabase — Complete Setup Skill

Add "Continue with Google" sign-in to any Supabase project. This skill covers the full flow from zero to working Google OAuth.

## Architecture

Supabase handles the entire OAuth flow server-side. The app needs:

1. **Google Cloud** — OAuth 2.0 Web Client credentials pointing at Supabase's callback URL
2. **Supabase** — Google provider enabled with those credentials
3. **Frontend** — A button calling `supabase.auth.signInWithOAuth({ provider: 'google' })`

```
User clicks "Continue with Google"
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Supabase redirects to Google consent screen
  → User approves
  → Google redirects to https://{ref}.supabase.co/auth/v1/callback
  → Supabase creates/signs in user
  → Supabase redirects to app's redirectTo URL (e.g. /auth/callback)
  → App detects SIGNED_IN event → navigates to home
```

No server-side code changes needed. `auth.uid()` in RLS policies works for all auth methods.

---

## Step 1: Gather Project Info

Before starting, collect:

```bash
# Get Supabase project ref
npx supabase projects list
# → Note the project ref (e.g. ttvluazchnkgalboansn)

# Get current gcloud account
gcloud config get-value account
# → Note which Google account to use
```

**Supabase callback URL pattern:**
```
https://{PROJECT_REF}.supabase.co/auth/v1/callback
```

---

## Step 2: Google Cloud Project (CLI)

Create a dedicated GCP project for OAuth credentials:

```bash
# Create project (name must be globally unique, 6-30 chars, lowercase + hyphens)
gcloud projects create {app-name}-oauth --name="{AppName} OAuth"

# Set as active project
gcloud config set project {app-name}-oauth

# Enable the OAuth API
gcloud services enable iap.googleapis.com
```

### GOTCHA: Billing
- New GCP projects may have no billing account linked
- OAuth consent screen creation may require billing
- If billing quota is exceeded, use an existing project instead
- Check: `gcloud billing projects describe {project-id}`

---

## Step 3: OAuth Consent Screen (Console — CLI Cannot Do This)

**WHY NOT CLI:** `gcloud` / IAP API can only create "Internal" consent screens locked to the org domain. For public apps, you MUST use the Google Cloud Console.

### Browser Steps:

1. Navigate to: `https://console.cloud.google.com/apis/credentials/consent?project={project-id}`
2. Select **External** (allows any Google account) or **Internal** (org-only)
3. Fill in:
   - App name: `{AppName}`
   - User support email: select from dropdown
   - Developer contact email: same email
4. Scopes: default (email, profile, openid) — no changes needed
5. Test users: skip for now (not needed once published)
6. Click **Publish App** to move out of testing mode (otherwise limited to 100 test users)

### GOTCHA: authuser Parameter
When the user has multiple Google accounts signed into Chrome, the Console may load the wrong account. Append `&authuser=N` to the URL:
- `authuser=0` — first account
- `authuser=1` — second account
- `authuser=2` — third account

Check which account is active by looking at the avatar in the top-right corner.

### GOTCHA: Internal vs External
- **Internal**: Only users within the Google Workspace org domain can sign in (e.g., only @company.com)
- **External**: Any Google account can sign in
- For production apps serving the public, MUST use External
- External apps in "Testing" mode are limited to 100 manually-added test users
- Click "Publish App" to remove the test user limit (no Google review needed for basic scopes)

### IMPORTANT: Switch to External + In Production

If the consent screen was created via `gcloud` / IAP API, it defaults to **Internal**. You MUST switch it:

1. Navigate to: `https://console.cloud.google.com/auth/audience?authuser={N}&project={project-id}`
2. The page shows **User type: Internal** with a **"Make external"** button
3. Click **"Make external"**
4. A dialog appears with **Publishing status** options:
   - **Testing** — limited to 100 manually-added test users
   - **In production** — available to anyone with a Google Account
5. Select **"In production"**
6. Click **Confirm**
7. Page should now show:
   - Publishing status: **In production**
   - User type: **External**

**Note:** For basic scopes (email, profile, openid), no Google verification/review is required. The "unverified app" warning screen may appear briefly for users but they can click through it. To remove that warning, submit for Google verification via the Verification Center in the left nav.

---

## Step 4: Create OAuth 2.0 Web Client (Console — CLI Cannot Do This)

**WHY NOT CLI:** `gcloud iap oauth-clients create` creates IAP-specific clients that cannot have custom redirect URIs. Standard web OAuth clients require the Console.

### Browser Steps:

1. Navigate to: `https://console.cloud.google.com/apis/credentials?project={project-id}`
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `{AppName} Supabase` (or any descriptive name)
5. Authorized redirect URIs → **+ ADD URI**:
   ```
   https://{PROJECT_REF}.supabase.co/auth/v1/callback
   ```
6. Click **Create**
7. Copy **Client ID** and **Client Secret** from the modal

### GOTCHA: Authorized JavaScript Origins
- NOT needed for Supabase OAuth flow (Supabase handles the redirect server-side)
- Only add if you're also using Google Sign-In client-side SDK directly

---

## Step 5: Configure Supabase Google Provider

### Via Supabase Dashboard (CLI has no auth provider commands):

1. Navigate to: `https://supabase.com/dashboard/project/{PROJECT_REF}/auth/providers`
2. Find **Google** in the provider list
3. Toggle **Enable**
4. Paste **Client ID** and **Client Secret**
5. Click **Save**

### Local Dev — config.toml:

Add to `supabase/config.toml` (after any existing `[auth.external.*]` blocks):

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
url = ""
skip_nonce_check = false
```

Add to `.env.local` or `.env` (for local Supabase):
```
GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=GOCSPX-your-secret-here
```

---

## Step 6: Frontend Code

### Handler Function

```typescript
async function handleGoogleLogin() {
  setLoading(true)
  setError(null)
  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (authError) {
    setError(authError.message)
    setLoading(false)
  }
  // Note: no setLoading(false) on success — browser navigates away to Google
}
```

### Google Button (with official multi-color G icon)

```tsx
<Button
  type="button"
  variant="outline"
  className="w-full h-11 gap-3 font-medium text-sm"
  onClick={handleGoogleLogin}
  disabled={loading}
>
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.41l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  Continue with Google
</Button>
```

### "or" Divider (between Google button and other auth methods)

```tsx
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-border" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-card px-2 text-muted-foreground">or</span>
  </div>
</div>
```

### Layout Order
1. Google OAuth button (top)
2. "or" divider
3. Existing auth methods (magic link, email/password, etc.)

---

## Step 7: Auth Callback Page

If the project already has an auth callback route handling `SIGNED_IN`, no changes needed. Otherwise, create one:

```tsx
// src/pages/AuthCallback.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  )
}
```

Add the route:
```tsx
<Route path="/auth/callback" element={<AuthCallback />} />
```

---

## No Changes Needed

These components work with Google OAuth automatically (no modifications required):

| Component | Why |
|-----------|-----|
| `AuthCallback` | Listens for `SIGNED_IN` event from any provider |
| `useAuth` hook | Uses `getSession()` + `onAuthStateChange()` — provider-agnostic |
| `ProtectedRoute` | Checks `user` object regardless of auth method |
| RLS policies | `auth.uid()` works for all Supabase auth providers |
| User profile queries | `auth.users` table populated by Supabase for all providers |

---

## Verification Checklist

- [ ] Google Cloud Console: OAuth consent screen configured (External if public)
- [ ] Google Cloud Console: Web OAuth client created with Supabase redirect URI
- [ ] Supabase Dashboard: Google provider enabled with client ID + secret
- [ ] `supabase/config.toml`: `[auth.external.google]` section added for local dev
- [ ] Login page: Google button renders above other auth methods
- [ ] Click flow: Google button → consent screen → callback → home page
- [ ] `npm run build` passes clean
- [ ] Works in both dark and light mode

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | Redirect URI in Google Console doesn't match Supabase | Ensure URI is exactly `https://{ref}.supabase.co/auth/v1/callback` |
| `access_denied` | OAuth consent screen is "Internal" and user is outside org | Switch to "External" in Console, or add user as test user |
| `invalid_client` | Wrong client ID/secret in Supabase | Re-copy from Google Console |
| 403 on consent screen | App in "Testing" mode, user not in test users list | Either add test user or click "Publish App" |
| `provider is not enabled` | Google not toggled on in Supabase | Dashboard → Auth → Providers → Google → Enable |

---

## CLI Limitations Summary

| Task | CLI Possible? | Tool to Use |
|------|---------------|-------------|
| Create GCP project | Yes | `gcloud projects create` |
| Enable APIs | Yes | `gcloud services enable` |
| OAuth consent screen (External) | No | Google Cloud Console |
| Web OAuth client ID | No | Google Cloud Console |
| Supabase provider config | No | Supabase Dashboard |
| `config.toml` local dev | Yes | Edit file directly |
| Frontend code | Yes | Edit files directly |

**Bottom line:** Two steps require the browser (Google Console + Supabase Dashboard). Everything else is CLI/code.
