const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Supabase error: ${response.status} - ${error}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
