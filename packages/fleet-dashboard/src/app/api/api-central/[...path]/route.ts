import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-central/auth-middleware'
import { supabaseRequest, isSupabaseConfigured } from '@/lib/api-central/supabase'

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
  updated_at?: string
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
  updated_at?: string
}

interface Project {
  id?: string
  name: string
  entity?: string
  description?: string
  active?: boolean
  scope?: string
}

function parsePath(params: { path: string[] }) {
  const resource = params.path[0] // 'services', 'secrets', 'projects', or 'stats'
  const resourceId = params.path[1]
  return { resource, resourceId }
}

// GET /api/api-central/services, /api/api-central/secrets, /api/api-central/stats, etc.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { resource, resourceId } = parsePath(await params)

  try {
    // ─── SERVICES ─────────────────────────────────────────────────────
    if (resource === 'services' && !resourceId) {
      const services = await supabaseRequest('api_services?order=name.asc')
      return NextResponse.json({ services })
    }

    if (resource === 'services' && resourceId) {
      const services = await supabaseRequest(`api_services?id=eq.${resourceId}`)
      if (!services || services.length === 0) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }
      return NextResponse.json(services[0])
    }

    // ─── SECRETS ──────────────────────────────────────────────────────
    if (resource === 'secrets' && !resourceId) {
      const secrets = await supabaseRequest('api_secrets?order=name.asc')
      return NextResponse.json({ secrets })
    }

    if (resource === 'secrets' && resourceId) {
      const secrets = await supabaseRequest(`api_secrets?id=eq.${resourceId}`)
      if (!secrets || secrets.length === 0) {
        return NextResponse.json({ error: 'Secret not found' }, { status: 404 })
      }
      return NextResponse.json(secrets[0])
    }

    // ─── PROJECTS ─────────────────────────────────────────────────────
    if (resource === 'projects' && !resourceId) {
      const projects = await supabaseRequest('projects?order=name.asc')
      return NextResponse.json({ projects })
    }

    // ─── STATS ────────────────────────────────────────────────────────
    if (resource === 'stats') {
      const [services, secrets]: [ApiService[], ApiSecret[]] = await Promise.all([
        supabaseRequest('api_services'),
        supabaseRequest('api_secrets'),
      ])

      const active = services.filter((s) => s.status === 'active')
      const totalBudget = active.reduce((a, s) => a + (s.monthly_budget || 0), 0)
      const totalSpend = active.reduce((a, s) => a + (s.current_spend || 0), 0)
      const overBudget = active.filter(
        (s) => (s.current_spend || 0) > (s.monthly_budget || 0)
      )

      const now = new Date()
      const in14Days = new Date(now)
      in14Days.setDate(now.getDate() + 14)

      const upcoming = services.filter((s) => {
        if (!s.renewal_date) return false
        const renewal = new Date(s.renewal_date)
        return renewal >= now && renewal <= in14Days
      })

      const byEntity: Record<string, number> = {}
      const byCategory: Record<string, number> = {}
      active.forEach((s) => {
        byEntity[s.entity || 'Other'] =
          (byEntity[s.entity || 'Other'] || 0) + (s.current_spend || 0)
        byCategory[s.category || 'Other'] =
          (byCategory[s.category || 'Other'] || 0) + (s.current_spend || 0)
      })

      return NextResponse.json({
        activeServices: active.length,
        totalServices: services.length,
        totalBudget,
        totalSpend,
        overBudgetCount: overBudget.length,
        overBudgetServices: overBudget.map((s) => s.name),
        secretsCount: secrets.length,
        servicesWithSecrets: new Set(secrets.map((s) => s.service_id)).size,
        upcomingRenewals: upcoming,
        byEntity,
        byCategory,
      })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('API Central error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/api-central/services, /api/api-central/secrets, /api/api-central/projects
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { resource } = parsePath(await params)
  const body = await request.json()

  try {
    if (resource === 'services') {
      const created = await supabaseRequest('api_services', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Prefer: 'return=representation' },
      })
      return NextResponse.json(created[0], { status: 201 })
    }

    if (resource === 'secrets') {
      const created = await supabaseRequest('api_secrets', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Prefer: 'return=representation' },
      })
      return NextResponse.json(created[0], { status: 201 })
    }

    if (resource === 'projects') {
      const created = await supabaseRequest('projects', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Prefer: 'return=representation' },
      })
      return NextResponse.json(created[0], { status: 201 })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('API Central error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// PATCH /api/api-central/services/:id, /api/api-central/secrets/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { resource, resourceId } = parsePath(await params)
  if (!resourceId) {
    return NextResponse.json({ error: 'Resource ID required' }, { status: 400 })
  }

  const body = await request.json()
  body.updated_at = new Date().toISOString()

  try {
    if (resource === 'services') {
      await supabaseRequest(`api_services?id=eq.${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      return NextResponse.json({ success: true })
    }

    if (resource === 'secrets') {
      await supabaseRequest(`api_secrets?id=eq.${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('API Central error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// DELETE /api/api-central/services/:id, /api/api-central/secrets/:id, /api/api-central/projects/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { resource, resourceId } = parsePath(await params)
  if (!resourceId) {
    return NextResponse.json({ error: 'Resource ID required' }, { status: 400 })
  }

  try {
    if (resource === 'services') {
      await supabaseRequest(`api_services?id=eq.${resourceId}`, { method: 'DELETE' })
      return NextResponse.json({ success: true })
    }

    if (resource === 'secrets') {
      await supabaseRequest(`api_secrets?id=eq.${resourceId}`, { method: 'DELETE' })
      return NextResponse.json({ success: true })
    }

    if (resource === 'projects') {
      await supabaseRequest(`projects?id=eq.${resourceId}`, { method: 'DELETE' })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error) {
    console.error('API Central error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
