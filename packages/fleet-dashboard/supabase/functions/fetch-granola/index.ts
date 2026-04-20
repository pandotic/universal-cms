import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GRANOLA_API_KEY = Deno.env.get('GRANOLA_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!GRANOLA_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GRANOLA_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { action, meeting_id } = await req.json()

    if (action === 'list') {
      // List recent Granola meetings
      const response = await fetch('https://api.granola.ai/v1/meetings?limit=10', {
        headers: { 'Authorization': `Bearer ${GRANOLA_API_KEY}` },
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'transcript' && meeting_id) {
      // Fetch transcript for a specific meeting
      const response = await fetch(`https://api.granola.ai/v1/meetings/${meeting_id}/transcript`, {
        headers: { 'Authorization': `Bearer ${GRANOLA_API_KEY}` },
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "list" or "transcript" with meeting_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Granola fetch failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
