# @pandotic/fleet-dashboard — Pandotic Hub

Cross-property operations dashboard. Next.js 16 App Router + Supabase auth.
Also hosts **Team Hub** at `/team-hub/*` (weekly ops meetings, issues,
to-dos, Granola transcripts).

## Team Hub — Granola transcript integration

Team Hub pulls meeting transcripts from [Granola](https://granola.ai) and
uses Claude to extract todos, decisions, and commitments. You can then
accept any of those directly into the to-do and commitments tables with
the correct owner attribution.

### How to use it

1. Join a meeting with Granola running as you normally would.
2. Open `/team-hub` (current meeting) or `/team-hub/meetings/<id>` (past
   meeting) and scroll to the **Closing** section.
3. Click **Fetch from Granola** — it lists your 10 most recent Granola
   meetings. Pick the one that matches this Team Hub meeting; the
   transcript populates the textarea.
4. Click **Process transcript**. Claude reads the transcript along with
   the team roster (Allen / Matt / Dan / Scott) and your open issues,
   and returns:
   - A one-sentence `ai_summary` of the meeting
   - Extracted to-dos (`{owner, description, due}`)
   - Extracted commitments (`{owner, description, source_quote, due_description}`)
   - Extracted decisions (`{topic, decision, participants}`)
   - Per-issue discussion notes
5. Review the checkboxes on extracted items (everything's ticked by
   default). Click **Accept** to write the ticked todos into the `todos`
   table and commitments into `commitments`, each attributed to the
   owner Claude inferred.

### What lives where

- **Schema:** `supabase/migrations/00121_team_hub_phase2.sql` — the
  `meeting_transcripts` table (one row per meeting, not per chunk).
- **Edge functions:**
  - `supabase/functions/fetch-granola/` — calls
    `https://api.granola.ai/v1/meetings` via the `GRANOLA_API_KEY`
    secret.
  - `supabase/functions/process-transcript/` — calls Claude Sonnet 4
    (`claude-sonnet-4-20250514`) via the `ANTHROPIC_API_KEY` secret,
    returns the JSON shape above.
- **Client:** `src/hooks/team-hub/useTranscript.ts` + the
  `TranscriptSync` and `TranscriptResults` components under
  `src/components/team-hub/meeting/`.
- **Where it renders:** embedded inside the `ClosingSection` of the
  agenda on both the current meeting (`/team-hub`) and past meetings
  (`/team-hub/meetings/[id]`).

### Required secrets

Both are set on the Hub Supabase project (`rimbgolutrxpmwsoswhq`):

```bash
supabase secrets set GRANOLA_API_KEY=<from your Granola account settings>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Check what's already set:

```bash
supabase secrets list
```

If either is missing, the UI buttons will error out. `ANTHROPIC_API_KEY`
should already be set (it's also used by `/social/generate`); confirm
before the first meeting.

### Checking whether real data has flowed through

Paste into the Supabase SQL editor at
https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/sql/new:

```sql
SELECT
  m.meeting_date,
  t.granola_meeting_id,
  t.granola_url,
  t.processed_at,
  left(t.ai_summary, 120) AS summary_preview,
  jsonb_array_length(COALESCE(t.ai_extracted_todos,       '[]'::jsonb)) AS todos,
  jsonb_array_length(COALESCE(t.ai_extracted_commitments, '[]'::jsonb)) AS commitments,
  jsonb_array_length(COALESCE(t.ai_extracted_decisions,   '[]'::jsonb)) AS decisions
FROM meeting_transcripts t
JOIN meetings m ON m.id = t.meeting_id
ORDER BY m.meeting_date DESC;
```

- Zero rows → no transcript has flowed through yet.
- `granola_meeting_id IS NULL` → the transcript was pasted manually;
  the Granola API path wasn't used.
- `processed_at IS NOT NULL` → Claude extraction ran.

### Future: auto-sync

Currently manual. The
[resume-point in `CLAUDE.md`](../../CLAUDE.md) notes that scheduling
`fetch-granola` via Supabase pg_cron (to run ~15 minutes after each
meeting's scheduled end time) is a reasonable follow-up once the team
has used the manual flow a few times.

## Team Hub — reseeding

`supabase/seed-team-hub.sql` is idempotent (uses `WHERE NOT EXISTS` on
every row). Safe to paste into the SQL editor more than once.

If you're seeing duplicate issues/todos in the live DB, it means an
earlier, non-idempotent version of the seed was run multiple times. Run
this once to collapse dupes:

```sql
DELETE FROM issues i
WHERE EXISTS (
  SELECT 1 FROM issues keep
  WHERE keep.title = i.title AND keep.created_at < i.created_at
);
DELETE FROM todos t
WHERE EXISTS (
  SELECT 1 FROM todos keep
  WHERE keep.description = t.description AND keep.created_at < t.created_at
);
```
