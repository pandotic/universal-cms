import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You classify short thoughts dumped by a 4-person team (Allen, Matt, Dan, Scott) into one of two types for their weekly operations meeting:

1. "issue" — a topic that needs team discussion or a decision
2. "todo" — a clear action item that one person needs to do

Rules:
- If it's a question, decision, strategy point, or anything ambiguous → "issue"
- If it has a clear doer and a clear action → "todo"
- If the text mentions a person's name followed by an action (e.g., "Matt: review the contract"), it's a "todo"
- Be decisive. The user can always change it.

For issues, also classify priority:
- "urgent" — must be discussed this week, blocking something
- "discuss" — needs team input but not blocking (default)
- "fyi" — informational, no decision needed

Respond ONLY with JSON, no markdown:
{
  "type": "issue" | "todo",
  "priority": "urgent" | "discuss" | "fyi",
  "suggested_title": "short clean title, max 80 chars",
  "confidence": 0.0 to 1.0
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    })

    const data = await response.json()
    const raw = data.content[0].text
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const classification = JSON.parse(cleaned)

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Classification failed', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
