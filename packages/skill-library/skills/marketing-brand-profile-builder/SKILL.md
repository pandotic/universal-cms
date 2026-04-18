---
name: marketing-brand-profile-builder
description: |
  Generate all derivative brand assets for a property in one shot — descriptions at 5 lengths
  (25/50/100/250/500 chars), per-platform social bios (Twitter, LinkedIn, Instagram, Facebook),
  press boilerplate, NAP fields, categories, keywords, hashtags, and JSON-LD schema — and upsert
  them to hub_brand_assets on the Pandotic Hub. Use when asked to "build brand profile", "generate
  brand assets", "create brand descriptions", "populate hub_brand_assets", or any variant of
  "draft the bios / boilerplate / schema for {brand}". Takes a single input: the property slug
  (e.g. "speed", "safemama"). Idempotent — re-running overwrites.
user-invocable: true
---

# Marketing Brand Profile Builder

Generates the full set of derivative brand assets for a single property in one pass, and writes them to `hub_brand_assets` on the Pandotic Hub Supabase project. One of the five Phase 3 marketing skills. See `MARKETING_OPS_PHASE_3_PLAN.md` in the repo root for the full slice plan.

> **This skill is self-contained.** All logic is below; the only external dependency is the `brand-profile-helper` script in `packages/fleet-dashboard/scripts/skill-helpers/`.

---

## How this works

You are Claude running inside the user's Claude Code session. This skill has two halves:

| Half | Who does it | What it does |
|---|---|---|
| **Read context** | A TypeScript helper script (`brand-profile-helper --read <slug>`) | Fetches property row, brand voice brief, existing brand assets. Returns JSON. Enforces kill_switch + business_stage gates. |
| **Generate + write** | You (Claude), in this session | Synthesize all the assets from the JSON context, write them to a JSON file, then invoke `brand-profile-helper --write <slug> --payload <file>` to upsert. |

You do not call any external LLM API. The synthesis happens inside your own conversation — you are the generator.

### Invocation

The user invokes this skill by saying any of:
- `/build-brand-profile speed`
- "Build brand assets for SafeMama"
- "Generate the brand profile for pandotic"

If the user hasn't specified a slug, ask for one and stop. Don't guess.

### Inputs and outputs

| In | Out |
|---|---|
| Property slug (e.g. `speed`) | Row in `hub_brand_assets` with 20+ populated fields |
|  | Printed summary of what was generated |

### Phased execution

Run these phases in order. Between phases, give the user a 1–2 sentence status update.

#### Phase 0 — Orient

Tell the user what you're about to do (2–3 sentences), confirm the slug, and read the context. No content generated yet.

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/brand-profile-helper.ts --read <slug>
```

The script prints a JSON blob with four top-level keys:

```json
{
  "property":        { "id": "…", "name": "…", "slug": "…", "url": "…",
                       "relationship_type": "pandotic_studio_product",
                       "site_profile": "marketing_only",
                       "business_stage": "active",
                       "business_category": "…",
                       "kill_switch": false,
                       "domains": ["speed.pandotic.ai"] },
  "brand_voice":     { … or null if no brief exists },
  "existing_assets": { … or null if first run },
  "gate":            { "allowed": true } or { "allowed": false, "reason": "…" }
}
```

**If `gate.allowed === false`, stop and tell the user why.** Do not generate anything.

**If `brand_voice` is null, warn the user** that the output will be generic without a voice brief, and ask whether to proceed anyway or stop so they can create a brief first. A voice brief lives in `hub_brand_voice_briefs`; see the Marketing Ops dashboard.

**If `existing_assets` is non-null**, mention that a prior profile exists and that this run will overwrite it. Ask for confirmation unless the user's original invocation included "refresh" or "overwrite".

#### Phase 1 — Visit the site (optional but recommended)

If the user is online and you have the `WebFetch` tool available, fetch `property.url` to get the actual product positioning, tagline, and hero copy. This grounds the assets in reality rather than just the slug.

Skip this phase if the site is gated, returns a non-200, or the user said "use what's in the DB only".

#### Phase 2 — Generate assets

Produce all of these in a single reply to yourself (a scratchpad), grounded in the voice brief + site content:

| Field | Constraint |
|---|---|
| `description_25` | ≤ 25 chars. Single-word-ish tagline. |
| `description_50` | ≤ 50 chars. One compelling phrase. |
| `description_100` | ≤ 100 chars. One-liner, search-result appropriate. |
| `description_250` | ≤ 250 chars. Paragraph intro. |
| `description_500` | ≤ 500 chars. Press-kit short description. |
| `bio_twitter` | ≤ 160 chars. Twitter/X bio. Emojis OK if voice allows. |
| `bio_linkedin` | ≤ 220 chars. LinkedIn company tagline. Professional tone. |
| `bio_instagram` | ≤ 150 chars. IG bio. Emojis + line breaks OK. |
| `bio_facebook` | ≤ 255 chars. FB page short description. |
| `category_primary` | One of the brand's actual industry categories. |
| `categories_secondary` | Array of 2–5 secondary categories. |
| `keywords` | Array of 8–15 SEO keywords. |
| `press_boilerplate` | 3–5 sentence "About {brand}" block for press releases. |
| `hashtags` | Object keyed by platform (`twitter`, `instagram`, `linkedin`): array of 5–10 hashtags each. |
| `nap_name` | Legal or DBA name for local SEO. |
| `nap_address` | Physical address (or "Remote-first" / null for digital-only). |
| `nap_phone` | Contact phone (or null). |
| `nap_email` | Contact email (or null). |
| `schema_jsonld` | JSON-LD `Organization` (or `SoftwareApplication` for `site_profile = app_only`) schema. Include `name`, `url`, `logo`, `sameAs` (from `domains`), `description` (= `description_250`). |

**Respect the playbook.** If `relationship_type = pandotic_client`, keep messaging client-agnostic (no "powered by Pandotic" anywhere). If `relationship_type = gbi_personal`, no Pandotic references at all — brand isolation is strict.

**Respect voice.** If a voice brief exists, pull the tone, anti-examples, and vocabulary into your word choice. If it doesn't, write in a neutral professional tone and note this in the final summary.

#### Phase 3 — Write payload

Write the generated JSON to `/tmp/brand-profile-<slug>.json`. Then invoke:

```bash
pnpm --filter @pandotic/fleet-dashboard exec tsx scripts/skill-helpers/brand-profile-helper.ts --write <slug> --payload /tmp/brand-profile-<slug>.json
```

The script returns `{ ok: true, asset_id: "…", property_id: "…" }` on success.

#### Phase 4 — Summary

Echo to the user:
- Brand name + slug
- 3 sample outputs: `description_100`, `bio_linkedin`, `press_boilerplate`
- Count of populated fields
- A link to review: `http://localhost:3001/marketing-ops/brands/<slug>` (assets tab)

Done. Total run time target: under 3 minutes.

---

## Edge cases

- **Slug not found** — The helper exits with JSON `{ "error": "…" }`. Tell the user and stop.
- **kill_switch = true** — `gate.allowed = false`. Refuse. Tell the user to clear the kill switch first.
- **business_stage ≠ active** — Same as above. Refuse.
- **No voice brief** — Warn, offer to proceed with neutral tone, or stop.
- **App-only brand (site_profile = app_only)** — Use `SoftwareApplication` schema type instead of `Organization`. Categories should focus on app category not business category.
- **Local service brand (site_profile = local_service)** — NAP fields are mandatory, not optional. If they're not in `property` or the site, ask the user before proceeding.

---

## Non-goals

- **Logos / favicons** — Visual asset generation is the Graphics Orchestrator's job (future phase).
- **Voice brief generation** — If missing, tell the user to create one in the Marketing Ops dashboard or wait for a future Brand Voice Generator skill.
- **Translations** — English only for MVP. Multi-language is a future concern.
- **Publishing to external platforms** — This skill only writes to `hub_brand_assets`. Pushing bios to actual Twitter/LinkedIn profiles is the Social Profile Creator's job.

---

## Debugging

If the write fails:

1. Verify env: `echo $SUPABASE_URL && echo $SUPABASE_SERVICE_ROLE_KEY | wc -c` (should be > 100).
2. Re-run the read to confirm the property still exists and is active.
3. Check migration 00111 has been applied: `SELECT column_name FROM information_schema.columns WHERE table_name='hub_brand_assets'` should return 20+ columns.
4. If the helper throws on JSON parse, your payload file has a syntax error. `cat /tmp/brand-profile-<slug>.json | jq .` to find it.
