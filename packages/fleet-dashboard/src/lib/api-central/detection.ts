// ─── Smart API Key Detection ─────────────────────────────────────────────────
// Auto-detect API key provider and category from key prefix patterns.
// Extracted from APICentral.tsx for reuse across the APIs & AI section.

export interface KeyDetectionResult {
  service: string
  category: string
  keyName: string
}

export const SERVICE_PATTERNS: { pattern: RegExp; service: string; category: string; keyName: string }[] = [
  // AI/LLM
  { pattern: /^sk-ant-/i, service: 'Anthropic', category: 'AI/LLM', keyName: 'ANTHROPIC_API_KEY' },
  { pattern: /^sk-proj-/i, service: 'OpenAI', category: 'AI/LLM', keyName: 'OPENAI_API_KEY' },
  { pattern: /^sk-[a-zA-Z0-9]{20,}$/i, service: 'OpenAI', category: 'AI/LLM', keyName: 'OPENAI_API_KEY' },
  { pattern: /^AIza[A-Za-z0-9_-]{35}$/i, service: 'Google Cloud', category: 'AI/LLM', keyName: 'GOOGLE_API_KEY' },
  { pattern: /^tvly-/i, service: 'Tavily', category: 'AI/LLM', keyName: 'TAVILY_API_KEY' },
  { pattern: /^r8_/i, service: 'Replicate', category: 'AI/LLM', keyName: 'REPLICATE_API_TOKEN' },
  { pattern: /^sk-or-/i, service: 'OpenRouter', category: 'AI/LLM', keyName: 'OPENROUTER_API_KEY' },
  { pattern: /^pplx-/i, service: 'Perplexity', category: 'AI/LLM', keyName: 'PERPLEXITY_API_KEY' },
  { pattern: /^hf_/i, service: 'Hugging Face', category: 'AI/LLM', keyName: 'HF_TOKEN' },
  { pattern: /^gsk_/i, service: 'Groq', category: 'AI/LLM', keyName: 'GROQ_API_KEY' },
  // Payments
  { pattern: /^sk_live_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_SECRET_KEY' },
  { pattern: /^sk_test_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_TEST_KEY' },
  { pattern: /^pk_live_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_PUBLISHABLE_KEY' },
  { pattern: /^pk_test_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_TEST_PUBLISHABLE_KEY' },
  { pattern: /^whsec_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_WEBHOOK_SECRET' },
  // Dev Tools
  { pattern: /^ghp_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_TOKEN' },
  { pattern: /^gho_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_OAUTH_TOKEN' },
  { pattern: /^ghu_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_USER_TOKEN' },
  { pattern: /^ghs_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_SERVER_TOKEN' },
  { pattern: /^github_pat_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_PAT' },
  { pattern: /^xoxb-/i, service: 'Slack', category: 'Dev Tools', keyName: 'SLACK_BOT_TOKEN' },
  { pattern: /^xoxp-/i, service: 'Slack', category: 'Dev Tools', keyName: 'SLACK_USER_TOKEN' },
  { pattern: /^xapp-/i, service: 'Slack', category: 'Dev Tools', keyName: 'SLACK_APP_TOKEN' },
  { pattern: /^SG\./i, service: 'SendGrid', category: 'Dev Tools', keyName: 'SENDGRID_API_KEY' },
  { pattern: /^re_/i, service: 'Resend', category: 'Dev Tools', keyName: 'RESEND_API_KEY' },
  // Database
  { pattern: /^eyJhbGciOi/i, service: 'Supabase', category: 'Database', keyName: 'SUPABASE_KEY' },
  // Hosting
  { pattern: /^AKIA[A-Z0-9]{16}$/i, service: 'AWS', category: 'Hosting', keyName: 'AWS_ACCESS_KEY_ID' },
  { pattern: /^np_/i, service: 'Netlify', category: 'Hosting', keyName: 'NETLIFY_AUTH_TOKEN' },
  { pattern: /^nfp_/i, service: 'Netlify', category: 'Hosting', keyName: 'NETLIFY_PERSONAL_TOKEN' },
]

const ENV_KEY_SERVICE_MAP: { keyword: string; service: string; category: string }[] = [
  { keyword: 'anthropic', service: 'Anthropic', category: 'AI/LLM' },
  { keyword: 'openai', service: 'OpenAI', category: 'AI/LLM' },
  { keyword: 'openrouter', service: 'OpenRouter', category: 'AI/LLM' },
  { keyword: 'groq', service: 'Groq', category: 'AI/LLM' },
  { keyword: 'perplexity', service: 'Perplexity', category: 'AI/LLM' },
  { keyword: 'hugging', service: 'Hugging Face', category: 'AI/LLM' },
  { keyword: 'replicate', service: 'Replicate', category: 'AI/LLM' },
  { keyword: 'tavily', service: 'Tavily', category: 'AI/LLM' },
  { keyword: 'stripe', service: 'Stripe', category: 'Payments' },
  { keyword: 'github', service: 'GitHub', category: 'Dev Tools' },
  { keyword: 'slack', service: 'Slack', category: 'Dev Tools' },
  { keyword: 'sendgrid', service: 'SendGrid', category: 'Dev Tools' },
  { keyword: 'resend', service: 'Resend', category: 'Dev Tools' },
  { keyword: 'supabase', service: 'Supabase', category: 'Database' },
  { keyword: 'aws', service: 'AWS', category: 'Hosting' },
  { keyword: 'netlify', service: 'Netlify', category: 'Hosting' },
  { keyword: 'google', service: 'Google Cloud', category: 'AI/LLM' },
]

export function detectFromValue(value: string): KeyDetectionResult | null {
  const trimmed = value.trim()
  // Check for KEY=VALUE format (e.g. ANTHROPIC_API_KEY=sk-ant-...)
  const envMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/s)
  if (envMatch) {
    const envKeyName = envMatch[1]
    const envValue = envMatch[2].trim()
    // Try to detect service from the value part
    for (const { pattern, service, category } of SERVICE_PATTERNS) {
      if (pattern.test(envValue)) {
        return { service, category, keyName: envKeyName }
      }
    }
    // Fall back to env key name matching
    const lowerKey = envKeyName.toLowerCase()
    for (const { keyword, service, category } of ENV_KEY_SERVICE_MAP) {
      if (lowerKey.includes(keyword)) {
        return { service, category, keyName: envKeyName }
      }
    }
    return null
  }

  // Try matching the raw value against known prefixes
  for (const { pattern, service, category, keyName } of SERVICE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { service, category, keyName }
    }
  }
  return null
}

export function handlePastedKey(pastedText: string): {
  value: string
  detected: KeyDetectionResult | null
} {
  const trimmed = pastedText.trim()
  // Check for KEY=VALUE format and extract just the value
  const envMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/s)
  const actualValue = envMatch ? envMatch[2].trim() : trimmed
  const detected = detectFromValue(trimmed)
  return { value: actualValue, detected }
}
