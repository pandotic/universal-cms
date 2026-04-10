import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You extract structured data from a meeting transcript for a 4-person team (Allen, Matt, Dan, Scott).

Extract three types of items:

1. **Action items (todos)**: Clear tasks someone committed to doing. Include:
   - owner: the person's name
   - description: what they need to do
   - due: when (e.g. "next meeting", "Friday", "end of month") or null

2. **Decisions**: Things the team decided. Include:
   - topic: what was being discussed
   - decision: what was decided
   - participants: who was involved in the decision

3. **Commitments**: Verbal promises or commitments someone made. These are different from action items — they're things someone *said they would do*, often phrased as "I'll", "I will", "I can handle that". Include:
   - owner: who made the commitment
   - description: what they committed to
   - quote: the approximate verbatim quote
   - due_description: any mentioned timeline, or null

4. **Issue discussion notes**: If the transcript discusses any of the provided open issues, extract a brief summary of what was discussed per issue. Include:
   - issue_title: matched to the provided open issues list
   - note: summary of the discussion about that issue

Also provide a brief 2-3 sentence summary of the meeting.

Respond ONLY with JSON, no markdown:
{
  "summary": "...",
  "todos": [...],
  "decisions": [...],
  "commitments": [...],
  "issue_notes": [...]
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { meeting_id, transcript_text, team_members, open_issues } = await req.json()

    const userMessage = `## Team members
${team_members.join(', ')}

## Open issues for matching
${open_issues.map((i: { id: string; title: string }) => `- ${i.title}`).join('\n') || 'None'}

## Transcript
${transcript_text}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const data = await response.json()
    const raw = data.content[0].text
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const extracted = JSON.parse(cleaned)

    // Write results to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    await supabase
      .from('meeting_transcripts')
      .upsert({
        meeting_id,
        transcript_text,
        ai_summary: extracted.summary,
        ai_extracted_todos: extracted.todos ?? [],
        ai_extracted_decisions: extracted.decisions ?? [],
        ai_extracted_commitments: extracted.commitments ?? [],
        processed_at: new Date().toISOString(),
      }, { onConflict: 'meeting_id' })

    return new Response(JSON.stringify({
      summary: extracted.summary,
      todos: extracted.todos ?? [],
      decisions: extracted.decisions ?? [],
      commitments: extracted.commitments ?? [],
      issue_notes: extracted.issue_notes ?? [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Transcript processing failed', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
