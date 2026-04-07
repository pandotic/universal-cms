import type { Handler } from '@netlify/functions'
import { requireAuth } from './lib/auth-middleware'
import { supabaseRequest, isSupabaseConfigured } from './lib/supabase'

interface ApiService {
  id?: string
  name: string
  url?: string
  category?: string
  entity?: string
  login_method?: string
  monthly_budget?: number
  current_spend?: number
  billing_cycle?: string
  renewal_date?: string
  status?: string
  notes?: string
  projects?: string[]
}

interface ApiSecret {
  id?: string
  service_id: string
  name: string
  value: string
  env?: string
  last_rotated?: string
  expires_at?: string
  encrypted?: boolean
}

interface Project {
  id?: string
  name: string
  entity?: string
  description?: string
  active?: boolean
}

const handler: Handler = async (event) => {
  const authError = requireAuth(event)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Supabase not configured' })
    }
  }

  const path = event.path.replace('/.netlify/functions/api-central', '')
  const parts = path.split('/').filter(Boolean)
  const resource = parts[0] // 'services', 'secrets', or 'stats'
  const resourceId = parts[1]

  try {
    // ─── SERVICES ─────────────────────────────────────────────────────

    // GET /api-central/services - List all services
    if (event.httpMethod === 'GET' && resource === 'services' && !resourceId) {
      const services = await supabaseRequest('api_services?order=name.asc')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services })
      }
    }

    // GET /api-central/services/:id - Get single service
    if (event.httpMethod === 'GET' && resource === 'services' && resourceId) {
      const services = await supabaseRequest(`api_services?id=eq.${resourceId}`)
      if (!services || services.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Service not found' }) }
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services[0])
      }
    }

    // POST /api-central/services - Create service
    if (event.httpMethod === 'POST' && resource === 'services') {
      const body: ApiService = JSON.parse(event.body || '{}')
      const created = await supabaseRequest('api_services', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Prefer': 'return=representation' }
      })
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created[0])
      }
    }

    // PATCH /api-central/services/:id - Update service
    if (event.httpMethod === 'PATCH' && resource === 'services' && resourceId) {
      const body: Partial<ApiService> = JSON.parse(event.body || '{}')
      body.updated_at = new Date().toISOString()
      await supabaseRequest(`api_services?id=eq.${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // DELETE /api-central/services/:id - Delete service (cascades to secrets)
    if (event.httpMethod === 'DELETE' && resource === 'services' && resourceId) {
      await supabaseRequest(`api_services?id=eq.${resourceId}`, {
        method: 'DELETE'
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // ─── SECRETS ──────────────────────────────────────────────────────

    // GET /api-central/secrets - List all secrets
    if (event.httpMethod === 'GET' && resource === 'secrets' && !resourceId) {
      const secrets = await supabaseRequest('api_secrets?order=name.asc')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secrets })
      }
    }

    // GET /api-central/secrets/:id - Get single secret
    if (event.httpMethod === 'GET' && resource === 'secrets' && resourceId) {
      const secrets = await supabaseRequest(`api_secrets?id=eq.${resourceId}`)
      if (!secrets || secrets.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Secret not found' }) }
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secrets[0])
      }
    }

    // POST /api-central/secrets - Create secret
    if (event.httpMethod === 'POST' && resource === 'secrets') {
      const body: ApiSecret = JSON.parse(event.body || '{}')
      const created = await supabaseRequest('api_secrets', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Prefer': 'return=representation' }
      })
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created[0])
      }
    }

    // PATCH /api-central/secrets/:id - Update secret
    if (event.httpMethod === 'PATCH' && resource === 'secrets' && resourceId) {
      const body: Partial<ApiSecret> = JSON.parse(event.body || '{}')
      body.updated_at = new Date().toISOString()
      await supabaseRequest(`api_secrets?id=eq.${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // DELETE /api-central/secrets/:id - Delete secret
    if (event.httpMethod === 'DELETE' && resource === 'secrets' && resourceId) {
      await supabaseRequest(`api_secrets?id=eq.${resourceId}`, {
        method: 'DELETE'
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // ─── PROJECTS ─────────────────────────────────────────────────────

    // GET /api-central/projects - List all projects
    if (event.httpMethod === 'GET' && resource === 'projects' && !resourceId) {
      const projects = await supabaseRequest('projects?order=name.asc')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects })
      }
    }

    // POST /api-central/projects - Create project
    if (event.httpMethod === 'POST' && resource === 'projects') {
      const body: Project = JSON.parse(event.body || '{}')
      const created = await supabaseRequest('projects', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Prefer': 'return=representation' }
      })
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created[0])
      }
    }

    // DELETE /api-central/projects/:id - Delete project
    if (event.httpMethod === 'DELETE' && resource === 'projects' && resourceId) {
      await supabaseRequest(`projects?id=eq.${resourceId}`, {
        method: 'DELETE'
      })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    // ─── STATS ────────────────────────────────────────────────────────

    // GET /api-central/stats - Get dashboard stats
    if (event.httpMethod === 'GET' && resource === 'stats') {
      const [services, secrets]: [ApiService[], ApiSecret[]] = await Promise.all([
        supabaseRequest('api_services'),
        supabaseRequest('api_secrets')
      ])

      const active = services.filter(s => s.status === 'active')
      const totalBudget = active.reduce((a, s) => a + (s.monthly_budget || 0), 0)
      const totalSpend = active.reduce((a, s) => a + (s.current_spend || 0), 0)
      const overBudget = active.filter(s => (s.current_spend || 0) > (s.monthly_budget || 0))

      const now = new Date()
      const in14Days = new Date(now)
      in14Days.setDate(now.getDate() + 14)

      const upcoming = services.filter(s => {
        if (!s.renewal_date) return false
        const renewal = new Date(s.renewal_date)
        return renewal >= now && renewal <= in14Days
      })

      const byEntity: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      active.forEach(s => {
        byEntity[s.entity || 'Other'] = (byEntity[s.entity || 'Other'] || 0) + (s.current_spend || 0)
        byCategory[s.category || 'Other'] = (byCategory[s.category || 'Other'] || 0) + (s.current_spend || 0)
      })

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeServices: active.length,
          totalServices: services.length,
          totalBudget,
          totalSpend,
          overBudgetCount: overBudget.length,
          overBudgetServices: overBudget.map(s => s.name),
          secretsCount: secrets.length,
          servicesWithSecrets: new Set(secrets.map(s => s.service_id)).size,
          upcomingRenewals: upcoming,
          byEntity,
          byCategory
        })
      }
    }

    return { statusCode: 405, body: 'Method not allowed' }

  } catch (error) {
    console.error('API Central error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) })
    }
  }
}

export { handler }
