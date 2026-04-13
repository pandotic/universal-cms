// ─── Formatting Helpers ──────────────────────────────────────────────────────
// Currency, percentage, date, and provider color utilities.
// Extracted from APICentral.tsx for reuse across the APIs & AI section.

export function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function pct(a: number, b: number): number {
  if (b === 0) return 0
  return Math.round((a / b) * 100)
}

export function getDaysUntil(date: string): number {
  const now = new Date()
  const target = new Date(date)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export const providerColors: Record<string, string> = {
  anthropic: 'bg-amber-500',
  openai: 'bg-emerald-500',
  google: 'bg-blue-500',
  supabase: 'bg-green-500',
  stripe: 'bg-purple-500',
  netlify: 'bg-teal-500',
  vercel: 'bg-zinc-500',
  groq: 'bg-orange-500',
  openrouter: 'bg-indigo-500',
  perplexity: 'bg-cyan-500',
  replicate: 'bg-rose-500',
  custom: 'bg-pink-500',
}

export const providerBadgeColors: Record<string, string> = {
  anthropic: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  openai: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  google: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  supabase: 'bg-green-500/10 text-green-400 ring-green-500/20',
  stripe: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  netlify: 'bg-teal-500/10 text-teal-400 ring-teal-500/20',
  vercel: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
  groq: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  openrouter: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
  perplexity: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  replicate: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
}

export const envBadgeColors: Record<string, string> = {
  production: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  staging: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  development: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  local: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
}
