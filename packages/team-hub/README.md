# @pandotic/team-hub

Internal app for the 4-person Pandotic founding team (Allen, Matt, Dan, Scott)
to run their weekly operations meeting and capture issues / to-dos throughout
the week. Vite + React 19 + TypeScript + Tailwind + Supabase.

Scope is intentionally narrow: two entities (issues, to-dos), one meeting flow,
a persistent dump bar that AI-classifies free-text input, and an archive.
Anything that sounds like a PM tool, CRM, or product tracker belongs in the
separate Command Center app.

## Local dev

```bash
pnpm install
cp packages/team-hub/.env.example packages/team-hub/.env.local
# Fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from the Supabase project.
pnpm --filter @pandotic/team-hub dev
```

Opens on http://localhost:5173. Unauthed visitors are redirected to `/login`,
which sends a magic link to any `@pandotic.com` email.

## Supabase project

This app targets the shared **Pandotic Hub** project (`rimbgolutrxpmwsoswhq`),
so one magic-link session covers both the Team Hub and the Fleet Dashboard
Hub admin.

### Applying migrations

Migrations live in `supabase/migrations/`:

| File | Purpose |
|---|---|
| `00001_initial.sql` | Core schema: users, issues, todos, meetings, standing items, chair rotation, command_center_flags, views, `create_next_meeting` RPC |
| `00002_phase2.sql` | Notes, issue discussions, meeting transcripts, commitments, timer columns |
| `00003_phase3.sql` | Meeting prep voting, issue ordering |
| `00004_auth.sql` | Links `auth.users` ↔ `public.users`, enforces `@pandotic.com`, tightens RLS, adds `completed_by` |

Apply via the Supabase CLI:

```bash
supabase link --project-ref rimbgolutrxpmwsoswhq
supabase db push   # applies every un-applied file in supabase/migrations/
```

Or paste each file into the Supabase dashboard SQL editor in order.

**⚠️ Naming collision check:** before applying to `rimbgolutrxpmwsoswhq`, confirm
that the Hub schema doesn't already own tables named `users`, `issues`, `todos`,
`meetings`, `standing_items`, `standing_item_templates`, or `chair_rotation`:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users','issues','todos','meetings','standing_items',
                     'standing_item_templates','chair_rotation',
                     'command_center_flags');
```

If any conflict, renaming with a `team_` prefix across migrations + source is
required before proceeding. Hub's own tables use `hub_*` prefixes, so only the
generic `users` is a real collision risk.

### Seeding the original agenda

```bash
supabase db execute --file supabase/seed.sql
```

This inserts the 9 starter items (ClickUp vs. own PM, Playbook pricing, Gaia
agreement, Burning Man demo, etc.) with the right submitters, owners, and ±7d
due dates.

### Linking auth users to seeded team rows

Each of the 4 seeded rows has an email (`allen@…`, `matt@…`, `dan@…`,
`scott@…`) but `auth_user_id = NULL` until they sign in. When a team member
requests their first magic link:

1. Supabase creates a row in `auth.users`.
2. The `on_auth_user_created` trigger (added by `00004_auth.sql`) looks up
   `public.users` by lowercased email and sets `auth_user_id`.
3. If the email domain is not `@pandotic.com`, the trigger raises and the
   sign-up is rejected.

If the seeded email is already taken by a stray `auth.users` row from earlier
testing, remove it from the Supabase dashboard (Authentication → Users) before
re-requesting the magic link.

## Edge functions

Two functions in `supabase/functions/`:

| Function | Purpose |
|---|---|
| `dump-classify` | Classifies dump-bar input as issue/todo + priority via Claude |
| `process-transcript` | Extracts todos/decisions/commitments from meeting transcripts |

Deploy:

```bash
supabase functions deploy dump-classify
supabase functions deploy process-transcript
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

The Hub project already has `ANTHROPIC_API_KEY` set for fleet-dashboard's
social-media generator; verify it's present before deploying.

## Auth settings (Supabase dashboard)

1. **Authentication → Providers** → enable **Email** with magic link.
2. **Authentication → URL Configuration** → add the deployed site URL and
   `http://localhost:5173` to Redirect URLs.
3. **Authentication → Email Templates** → optional; the default magic-link
   template is fine.

Domain restriction is enforced server-side by the trigger in `00004_auth.sql`
and client-side by `src/lib/auth.ts`.

## Deploy (Netlify)

`netlify.toml` in this directory sets base dir, build command, and publish
dir. Create a Netlify site pointing at this repo with **base directory =
`packages/team-hub`**, then set the two env vars (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) on the Netlify site.

Once deployed, paste the `*.netlify.app` URL into fleet-dashboard's
`NEXT_PUBLIC_TEAM_HUB_URL` env so the left-sidebar "Team Hub" link works.

## What's where

```
src/
├── App.tsx                      # Router: /login + auth-gated routes
├── lib/
│   ├── supabase.ts              # Anon client
│   ├── auth.ts                  # signInWithMagicLink, signOut
│   └── types.ts                 # DB row types
├── hooks/
│   ├── useAuth.ts               # Session + linked public.users row
│   ├── useIssues.ts / useTodos.ts / useMeetings.ts / ...
│   └── useDumpClassify.ts       # Calls dump-classify edge function
├── pages/
│   ├── LoginPage.tsx
│   ├── WeeklyMeetingPage.tsx    # "/"
│   ├── IssuesPage.tsx
│   ├── TodosPage.tsx
│   ├── PastMeetingsPage.tsx
│   └── MeetingDetailPage.tsx
└── components/
    ├── layout/ (AppShell, Sidebar, UserMenu, RequireAuth)
    ├── dump/ (DumpBar, DumpModal, AiClassificationPanel)
    ├── meeting/ (MeetingHeader, AttendancePills, sections/)
    ├── issues/ (IssueCard, ResolveDialog)
    └── todos/ (TodoItem)
```
