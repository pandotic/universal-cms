import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { authHeaders } from '@/lib/auth'
import { logger } from '@/lib/logger'

// ─── API Config (customize this base URL for your project) ──────────
const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'
const API = {
  apiServices: (id?: string) => id ? `${API_BASE}/api-central/services/${id}` : `${API_BASE}/api-central/services`,
  apiSecrets: (id?: string) => id ? `${API_BASE}/api-central/secrets/${id}` : `${API_BASE}/api-central/secrets`,
  apiProjects: `${API_BASE}/api-central/projects`,
  apiStats: `${API_BASE}/api-central/stats`,
}

import {
  ChevronLeft,
  Key,
  Globe,
  DollarSign,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Shield,
  LayoutGrid,
  RefreshCw,
  Lock,
  Unlock,
  ClipboardPaste
} from 'lucide-react'

interface ApiService {
  id: string
  name: string
  url?: string
  category: string
  entity: string
  login_method?: string
  monthly_budget: number
  current_spend: number
  billing_cycle: string
  renewal_date?: string
  status: string
  notes?: string
  projects?: string[]
}

interface ApiSecret {
  id: string
  service_id: string
  name: string
  value: string
  env: string
  last_rotated?: string
  expires_at?: string
  encrypted?: boolean
}

interface Project {
  id: string
  name: string
  entity: string
  description?: string
  active: boolean
}

interface Stats {
  activeServices: number
  totalServices: number
  totalBudget: number
  totalSpend: number
  overBudgetCount: number
  secretsCount: number
  servicesWithSecrets: number
  upcomingRenewals: ApiService[]
  byEntity: Record<string, number>
  byCategory: Record<string, number>
}

const CATEGORIES = ['AI/LLM', 'Database', 'Hosting', 'Dev Tools', 'Observability', 'Payments', 'Other']
const ENTITIES = ['GBI', 'Pandotic', 'FireShield', 'Personal']
const STATUSES = ['active', 'inactive', 'trial', 'cancelled']
const LOGIN_METHODS = ['Google (personal)', 'Google (GBI)', 'GitHub', 'Email (personal)', 'Email (GBI)', 'SSO', 'Other']
const ENVS = ['production', 'staging', 'development', 'local']

const emptyService: Partial<ApiService> = {
  name: '',
  url: '',
  category: 'Other',
  entity: 'GBI',
  login_method: 'GitHub',
  monthly_budget: 0,
  current_spend: 0,
  billing_cycle: 'monthly',
  status: 'active',
  notes: '',
  projects: []
}

const emptySecret: Partial<ApiSecret> = {
  service_id: '',
  name: '',
  value: '',
  env: 'production',
  last_rotated: new Date().toISOString().split('T')[0],
  encrypted: false
}

type TabId = 'dashboard' | 'quick-add' | 'services' | 'secrets' | 'spend'

// ─── ENCRYPTION HELPERS ───────────────────────────────────────────────
const ENCRYPTION_PREFIX = 'ENC:'

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptValue(value: string, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(pin, salt)
  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(value)
  )
  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined))
}

async function decryptValue(encryptedValue: string, pin: string): Promise<string> {
  if (!encryptedValue.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedValue // Not encrypted
  }
  try {
    const data = Uint8Array.from(atob(encryptedValue.slice(ENCRYPTION_PREFIX.length)), c => c.charCodeAt(0))
    const salt = data.slice(0, 16)
    const iv = data.slice(16, 28)
    const encrypted = data.slice(28)
    const key = await deriveKey(pin, salt)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encrypted.buffer as ArrayBuffer
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    throw new Error('Invalid PIN or corrupted data')
  }
}

export function APICentral() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [services, setServices] = useState<ApiService[]>([])
  const [secrets, setSecrets] = useState<ApiSecret[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterEntity, setFilterEntity] = useState('All')

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [secretModalOpen, setSecretModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<ApiService> | null>(null)
  const [editingSecret, setEditingSecret] = useState<Partial<ApiSecret> | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'service' | 'secret', id: string, name: string } | null>(null)

  // Secrets UI & Security
  const [revealedSecrets, setRevealedSecrets] = useState<Map<string, string>>(new Map()) // id -> decrypted value
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinAction, setPinAction] = useState<{ type: 'reveal' | 'save', secretId?: string } | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [sessionPin, setSessionPin] = useState<string | null>(null) // Remember PIN for session

  // Quick Add state
  const [quickAddValue, setQuickAddValue] = useState('')
  const [quickAddServiceName, setQuickAddServiceName] = useState('')
  const [quickAddKeyName, setQuickAddKeyName] = useState('')
  const [quickAddEnv, setQuickAddEnv] = useState('production')
  const [quickAddEncrypt, setQuickAddEncrypt] = useState(true)
  const [quickAddAutoDetected, setQuickAddAutoDetected] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [servicesRes, secretsRes, statsRes, projectsRes] = await Promise.all([
        fetch(API.apiServices(), { headers: authHeaders() }),
        fetch(API.apiSecrets(), { headers: authHeaders() }),
        fetch(API.apiStats, { headers: authHeaders() }),
        fetch(API.apiProjects, { headers: authHeaders() })
      ])

      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data.services || [])
      }
      if (secretsRes.ok) {
        const data = await secretsRes.json()
        setSecrets(data.secrets || [])
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      logger.error('Failed to load API Central data:', err)
      toast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Service CRUD
  async function saveService() {
    if (!editingService?.name) return
    setSaving(true)
    try {
      const isNew = !editingService.id
      const url = isNew
        ? API.apiServices()
        : API.apiServices(editingService.id)

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(editingService)
      })

      if (response.ok) {
        setServiceModalOpen(false)
        setEditingService(null)
        toast(isNew ? 'Service added' : 'Service updated', 'success')
        loadData()
      }
    } catch {
      toast('Failed to save service', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteService(id: string) {
    try {
      await fetch(API.apiServices(id), { method: 'DELETE', headers: authHeaders() })
      setDeleteConfirm(null)
      toast('Service deleted', 'success')
      loadData()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  // Secret CRUD with encryption
  async function saveSecret(pin?: string) {
    if (!editingSecret?.name || !editingSecret?.value) return

    // If encrypting and no PIN provided, ask for PIN
    if (editingSecret.encrypted && !pin && !sessionPin) {
      setPinAction({ type: 'save' })
      setPinModalOpen(true)
      return
    }

    const effectivePin = pin || sessionPin
    setSaving(true)
    try {
      let valueToStore = editingSecret.value
      if (editingSecret.encrypted && effectivePin) {
        valueToStore = await encryptValue(editingSecret.value, effectivePin)
      }

      const isNew = !editingSecret.id
      const url = isNew
        ? API.apiSecrets()
        : API.apiSecrets(editingSecret.id)

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ ...editingSecret, value: valueToStore })
      })

      if (response.ok) {
        setSecretModalOpen(false)
        setEditingSecret(null)
        toast(isNew ? 'Secret added' : 'Secret updated', 'success')
        loadData()
      }
    } catch {
      toast('Failed to save secret', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSecret(id: string) {
    try {
      await fetch(API.apiSecrets(id), { method: 'DELETE', headers: authHeaders() })
      setDeleteConfirm(null)
      toast('Secret deleted', 'success')
      loadData()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  // ─── SMART PASTE DETECTION ──────────────────────────────────────────
  const SERVICE_PATTERNS: { pattern: RegExp; service: string; category: string; keyName: string }[] = [
    { pattern: /^sk-ant-/i, service: 'Anthropic', category: 'AI/LLM', keyName: 'ANTHROPIC_API_KEY' },
    { pattern: /^sk-proj-/i, service: 'OpenAI', category: 'AI/LLM', keyName: 'OPENAI_API_KEY' },
    { pattern: /^sk-[a-zA-Z0-9]{20,}$/i, service: 'OpenAI', category: 'AI/LLM', keyName: 'OPENAI_API_KEY' },
    { pattern: /^AIza[A-Za-z0-9_-]{35}$/i, service: 'Google Cloud', category: 'AI/LLM', keyName: 'GOOGLE_API_KEY' },
    { pattern: /^sk_live_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_SECRET_KEY' },
    { pattern: /^sk_test_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_TEST_KEY' },
    { pattern: /^pk_live_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_PUBLISHABLE_KEY' },
    { pattern: /^pk_test_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_TEST_PUBLISHABLE_KEY' },
    { pattern: /^whsec_/i, service: 'Stripe', category: 'Payments', keyName: 'STRIPE_WEBHOOK_SECRET' },
    { pattern: /^ghp_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_TOKEN' },
    { pattern: /^gho_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_OAUTH_TOKEN' },
    { pattern: /^ghu_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_USER_TOKEN' },
    { pattern: /^ghs_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_SERVER_TOKEN' },
    { pattern: /^github_pat_/i, service: 'GitHub', category: 'Dev Tools', keyName: 'GITHUB_PAT' },
    { pattern: /^xoxb-/i, service: 'Slack', category: 'Dev Tools', keyName: 'SLACK_BOT_TOKEN' },
    { pattern: /^xoxp-/i, service: 'Slack', category: 'Dev Tools', keyName: 'SLACK_USER_TOKEN' },
    { pattern: /^xapp-/i, service: 'Slack', category: 'Dev Tools', keyName: 'SLACK_APP_TOKEN' },
    { pattern: /^SG\./i, service: 'SendGrid', category: 'Dev Tools', keyName: 'SENDGRID_API_KEY' },
    { pattern: /^eyJhbGciOi/i, service: 'Supabase', category: 'Database', keyName: 'SUPABASE_KEY' },
    { pattern: /^AKIA[A-Z0-9]{16}$/i, service: 'AWS', category: 'Hosting', keyName: 'AWS_ACCESS_KEY_ID' },
    { pattern: /^np_/i, service: 'Netlify', category: 'Hosting', keyName: 'NETLIFY_AUTH_TOKEN' },
    { pattern: /^nfp_/i, service: 'Netlify', category: 'Hosting', keyName: 'NETLIFY_PERSONAL_TOKEN' },
    { pattern: /^tvly-/i, service: 'Tavily', category: 'AI/LLM', keyName: 'TAVILY_API_KEY' },
    { pattern: /^r8_/i, service: 'Replicate', category: 'AI/LLM', keyName: 'REPLICATE_API_TOKEN' },
  ]

  function detectFromValue(value: string): { service: string; category: string; keyName: string } | null {
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
      // Even if value doesn't match a pattern, use the key name to guess service
      const lowerKey = envKeyName.toLowerCase()
      if (lowerKey.includes('anthropic')) return { service: 'Anthropic', category: 'AI/LLM', keyName: envKeyName }
      if (lowerKey.includes('openai')) return { service: 'OpenAI', category: 'AI/LLM', keyName: envKeyName }
      if (lowerKey.includes('stripe')) return { service: 'Stripe', category: 'Payments', keyName: envKeyName }
      if (lowerKey.includes('github')) return { service: 'GitHub', category: 'Dev Tools', keyName: envKeyName }
      if (lowerKey.includes('slack')) return { service: 'Slack', category: 'Dev Tools', keyName: envKeyName }
      if (lowerKey.includes('supabase')) return { service: 'Supabase', category: 'Database', keyName: envKeyName }
      if (lowerKey.includes('aws')) return { service: 'AWS', category: 'Hosting', keyName: envKeyName }
      if (lowerKey.includes('netlify')) return { service: 'Netlify', category: 'Hosting', keyName: envKeyName }
      if (lowerKey.includes('google')) return { service: 'Google Cloud', category: 'AI/LLM', keyName: envKeyName }
      if (lowerKey.includes('sendgrid')) return { service: 'SendGrid', category: 'Dev Tools', keyName: envKeyName }
      if (lowerKey.includes('replicate')) return { service: 'Replicate', category: 'AI/LLM', keyName: envKeyName }
      if (lowerKey.includes('tavily')) return { service: 'Tavily', category: 'AI/LLM', keyName: envKeyName }
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

  function handleQuickAddPaste(pastedText: string) {
    const trimmed = pastedText.trim()
    // Check for KEY=VALUE format and extract just the value
    const envMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/s)
    const actualValue = envMatch ? envMatch[2].trim() : trimmed

    const detected = detectFromValue(trimmed)
    if (detected) {
      setQuickAddServiceName(detected.service)
      setQuickAddKeyName(prev => prev || detected.keyName)
      setQuickAddAutoDetected(true)
      // If KEY=VALUE format, only store the value part
      setQuickAddValue(actualValue)
    } else {
      setQuickAddValue(actualValue)
      setQuickAddAutoDetected(false)
    }
  }

  // Matching services for autocomplete
  const matchingServices = useMemo(() => {
    if (!quickAddServiceName) return []
    const q = quickAddServiceName.toLowerCase()
    return services.filter(s => s.name.toLowerCase().includes(q))
  }, [quickAddServiceName, services])

  // Quick Add
  async function quickAddSecret() {
    if (!quickAddServiceName || !quickAddKeyName || !quickAddValue) {
      toast('Fill in all fields', 'error')
      return
    }

    // If encrypting and no session PIN, ask for PIN
    if (quickAddEncrypt && !sessionPin) {
      setPinAction({ type: 'save' })
      setPinModalOpen(true)
      return
    }

    setSaving(true)
    try {
      // Find existing service or create new one
      let serviceId = ''
      const existingService = services.find(s =>
        s.name.toLowerCase() === quickAddServiceName.toLowerCase()
      )

      if (existingService) {
        serviceId = existingService.id
      } else {
        // Auto-create the service with minimal defaults
        const detected = detectFromValue(quickAddValue) || detectFromValue(quickAddKeyName)
        const category = detected?.category || 'Other'

        const createRes = await fetch(API.apiServices(), {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name: quickAddServiceName,
            category,
            entity: 'GBI',
            status: 'active',
            monthly_budget: 0,
            current_spend: 0,
            billing_cycle: 'monthly',
          })
        })

        if (!createRes.ok) {
          toast('Failed to create service', 'error')
          return
        }

        const created = await createRes.json()
        serviceId = created.service?.id || created.id
        if (!serviceId) {
          toast('Failed to get service ID', 'error')
          return
        }
      }

      let valueToStore = quickAddValue
      if (quickAddEncrypt && sessionPin) {
        valueToStore = await encryptValue(quickAddValue, sessionPin)
      }

      const response = await fetch(API.apiSecrets(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          service_id: serviceId,
          name: quickAddKeyName,
          value: valueToStore,
          env: quickAddEnv,
          encrypted: quickAddEncrypt,
          last_rotated: new Date().toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        const serviceName = quickAddServiceName
        const wasNew = !existingService
        toast(wasNew ? `Service "${serviceName}" created & secret added` : 'Secret added', 'success')
        setQuickAddValue('')
        setQuickAddKeyName('')
        setQuickAddServiceName('')
        setQuickAddAutoDetected(false)
        loadData()
      }
    } catch {
      toast('Failed to add secret', 'error')
    } finally {
      setSaving(false)
    }
  }

  // PIN handling
  const handlePinSubmit = useCallback(async () => {
    if (!pinInput || pinInput.length < 4) {
      toast('PIN must be at least 4 characters', 'error')
      return
    }

    setSessionPin(pinInput)
    setPinModalOpen(false)

    if (pinAction?.type === 'reveal' && pinAction.secretId) {
      // Reveal secret with this PIN
      const secret = secrets.find(s => s.id === pinAction.secretId)
      if (secret) {
        try {
          const decrypted = await decryptValue(secret.value, pinInput)
          setRevealedSecrets(prev => new Map(prev).set(secret.id, decrypted))
        } catch {
          toast('Invalid PIN', 'error')
          setSessionPin(null)
        }
      }
    } else if (pinAction?.type === 'save') {
      // Continue with save
      if (editingSecret) {
        saveSecret(pinInput)
      } else if (quickAddValue) {
        // Re-run quick add
        quickAddSecret()
      }
    }

    setPinInput('')
    setPinAction(null)
  }, [pinInput, pinAction, secrets, editingSecret, quickAddValue, quickAddServiceName])

  // Secret helpers
  async function toggleReveal(secret: ApiSecret) {
    if (revealedSecrets.has(secret.id)) {
      // Hide it
      setRevealedSecrets(prev => {
        const next = new Map(prev)
        next.delete(secret.id)
        return next
      })
    } else {
      // Need to reveal
      if (secret.encrypted) {
        if (sessionPin) {
          try {
            const decrypted = await decryptValue(secret.value, sessionPin)
            setRevealedSecrets(prev => new Map(prev).set(secret.id, decrypted))
          } catch {
            toast('Invalid PIN - clearing session', 'error')
            setSessionPin(null)
            setPinAction({ type: 'reveal', secretId: secret.id })
            setPinModalOpen(true)
          }
        } else {
          setPinAction({ type: 'reveal', secretId: secret.id })
          setPinModalOpen(true)
        }
      } else {
        // Not encrypted, just reveal
        setRevealedSecrets(prev => new Map(prev).set(secret.id, secret.value))
      }
    }
  }

  async function copyToClipboard(secret: ApiSecret) {
    try {
      let valueToCopy = secret.value
      if (secret.encrypted) {
        if (revealedSecrets.has(secret.id)) {
          valueToCopy = revealedSecrets.get(secret.id)!
        } else if (sessionPin) {
          valueToCopy = await decryptValue(secret.value, sessionPin)
        } else {
          toast('Reveal secret first to copy', 'error')
          return
        }
      }
      await navigator.clipboard.writeText(valueToCopy)
      setCopiedId(secret.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      toast('Copy failed', 'error')
    }
  }

  function maskValue(v: string) {
    if (v.startsWith(ENCRYPTION_PREFIX)) return '**encrypted**'
    if (v.length <= 12) return '••••••••'
    return v.slice(0, 6) + '••••••' + v.slice(-4)
  }

  function getDaysUntil(date?: string): number | null {
    if (!date) return null
    const diff = (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    return Math.ceil(diff)
  }

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (filterCategory !== 'All' && s.category !== filterCategory) return false
      if (filterEntity !== 'All' && s.entity !== filterEntity) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.notes?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [services, filterCategory, filterEntity, search])

  // Grouped secrets
  const groupedSecrets = useMemo(() => {
    const grouped: Record<string, { service: ApiService | undefined, secrets: ApiSecret[] }> = {}
    secrets.forEach(sec => {
      const svc = services.find(s => s.id === sec.service_id)
      const key = svc?.name || 'Unknown'
      if (!grouped[key]) grouped[key] = { service: svc, secrets: [] }
      grouped[key].secrets.push(sec)
    })
    return grouped
  }, [services, secrets])

  const fmt = (n: number) => `$${n.toFixed(2)}`
  const pct = (a: number, b: number) => b > 0 ? Math.min(Math.round((a / b) * 100), 100) : 0

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutGrid },
    { id: 'quick-add' as const, label: 'Quick Add', icon: ClipboardPaste },
    { id: 'services' as const, label: 'Services', icon: Globe },
    { id: 'secrets' as const, label: 'Secrets', icon: Key },
    { id: 'spend' as const, label: 'Spend', icon: DollarSign },
  ]

  // ─── RENDER: QUICK ADD ──────────────────────────────────────────────
  const renderQuickAdd = () => (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ClipboardPaste className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold">Quick Add Secret</h2>
              <p className="text-sm text-muted-foreground">Paste an API key — service and key name auto-detected</p>
            </div>
            {sessionPin && (
              <Badge variant="success" className="ml-auto flex items-center gap-1">
                <Lock className="w-3 h-3" /> PIN Active
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            {/* Smart paste area - this is the primary input */}
            <div>
              <label className="text-sm font-medium mb-1 block">Paste API Key or Secret *</label>
              <textarea
                value={quickAddValue}
                onChange={(e) => {
                  setQuickAddValue(e.target.value)
                  // Only auto-detect on paste-like changes (large text additions)
                  if (e.target.value.length > quickAddValue.length + 5) {
                    handleQuickAddPaste(e.target.value)
                  }
                }}
                onPaste={(e) => {
                  // Let the onChange fire with pasted content, then detect
                  setTimeout(() => {
                    const el = e.target as HTMLTextAreaElement
                    handleQuickAddPaste(el.value)
                  }, 0)
                }}
                placeholder="Paste: sk-ant-abc123... or ANTHROPIC_API_KEY=sk-ant-abc123..."
                className="w-full bg-secondary text-secondary-foreground px-3 py-3 rounded-md text-sm border border-input font-mono resize-none h-24"
              />
              {quickAddAutoDetected && (
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" aria-hidden="true" />
                  Auto-detected: {quickAddServiceName} — {quickAddKeyName}
                </p>
              )}
            </div>

            {/* Service name + Key name side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-sm font-medium mb-1 block">Service Name *</label>
                <Input
                  value={quickAddServiceName}
                  onChange={(e) => {
                    setQuickAddServiceName(e.target.value)
                    setQuickAddAutoDetected(false)
                  }}
                  placeholder="e.g., Anthropic, Stripe"
                />
                {/* Autocomplete suggestions */}
                {quickAddServiceName && matchingServices.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-32 overflow-auto">
                    {matchingServices.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => {
                          setQuickAddServiceName(s.name)
                        }}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">{s.category}</span>
                      </button>
                    ))}
                  </div>
                )}
                {quickAddServiceName && !matchingServices.some(s => s.name.toLowerCase() === quickAddServiceName.toLowerCase()) && quickAddServiceName.length > 1 && (
                  <p className="text-xs text-amber-500 mt-1">New service — will be created on save</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Key Name *</label>
                <Input
                  value={quickAddKeyName}
                  onChange={(e) => setQuickAddKeyName(e.target.value)}
                  placeholder="e.g., ANTHROPIC_API_KEY"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Environment + Encrypt */}
            <div className="flex items-center gap-4">
              <div className="w-40">
                <label className="text-sm font-medium mb-1 block">Environment</label>
                <select
                  value={quickAddEnv}
                  onChange={(e) => setQuickAddEnv(e.target.value)}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  {ENVS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="quick-encrypt"
                  checked={quickAddEncrypt}
                  onChange={(e) => setQuickAddEncrypt(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="quick-encrypt" className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  Encrypt with PIN
                </label>
              </div>
            </div>

            {/* Save button */}
            <Button
              onClick={quickAddSecret}
              disabled={saving || !quickAddServiceName || !quickAddKeyName || !quickAddValue}
              className="w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {services.some(s => s.name.toLowerCase() === quickAddServiceName.toLowerCase())
                ? 'Save Secret'
                : quickAddServiceName
                  ? `Create "${quickAddServiceName}" & Save Secret`
                  : 'Save Secret'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent secrets */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Recently Added</h3>
          {secrets.slice(0, 5).map(sec => {
            const svc = services.find(s => s.id === sec.service_id)
            return (
              <div key={sec.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {sec.encrypted && <Lock className="w-3 h-3 text-amber-500" />}
                  <code className="text-sm font-semibold">{sec.name}</code>
                  <span className="text-xs text-muted-foreground">{svc?.name}</span>
                </div>
                <Badge variant="outline">{sec.env}</Badge>
              </div>
            )
          })}
          {secrets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No secrets yet</p>
          )}
        </CardContent>
      </Card>

      {/* PIN setup */}
      {!sessionPin && (
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Set Your Session PIN</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A PIN encrypts your secrets. You'll need it to view or copy encrypted values.
            </p>
            <Button variant="outline" onClick={() => { setPinAction({ type: 'save' }); setPinModalOpen(true); }}>
              <Lock className="w-4 h-4 mr-2" /> Set PIN for This Session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // ─── RENDER: DASHBOARD ──────────────────────────────────────────────
  const renderDashboard = () => {
    if (!stats) return null
    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Active Services</p>
                  <p className="text-3xl font-bold">{stats.activeServices}</p>
                  <p className="text-sm text-muted-foreground">{stats.totalServices} total</p>
                </div>
                <Globe className="w-5 h-5 text-blue-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Monthly Spend</p>
                  <p className="text-3xl font-bold text-amber-500">{fmt(stats.totalSpend)}</p>
                  <p className="text-sm text-muted-foreground">of {fmt(stats.totalBudget)} budget</p>
                </div>
                <DollarSign className="w-5 h-5 text-amber-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">API Secrets</p>
                  <p className="text-3xl font-bold text-emerald-500">{stats.secretsCount}</p>
                  <p className="text-sm text-muted-foreground">across {stats.servicesWithSecrets} services</p>
                </div>
                <Key className="w-5 h-5 text-emerald-500 opacity-60" />
              </div>
            </CardContent>
          </Card>
          <Card className={stats.overBudgetCount > 0 ? 'border-destructive/50' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Over Budget</p>
                  <p className={`text-3xl font-bold ${stats.overBudgetCount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                    {stats.overBudgetCount}
                  </p>
                  <p className="text-sm text-muted-foreground">{stats.overBudgetCount > 0 ? 'needs attention' : 'all good'}</p>
                </div>
                <AlertTriangle className={`w-5 h-5 opacity-60 ${stats.overBudgetCount > 0 ? 'text-destructive' : 'text-emerald-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* By Entity */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Spend by Entity</h3>
              {Object.entries(stats.byEntity).sort((a, b) => b[1] - a[1]).map(([entity, amount]) => (
                <div key={entity} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm">{entity}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-secondary rounded overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded"
                        style={{ width: `${pct(amount, stats.totalSpend)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-amber-500 w-16 text-right font-mono">
                      {fmt(amount)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Category */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Spend by Category</h3>
              {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm">{cat}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-secondary rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded"
                        style={{ width: `${pct(amount, stats.totalSpend)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-blue-500 w-16 text-right font-mono">
                      {fmt(amount)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Renewals */}
        {stats.upcomingRenewals.length > 0 && (
          <Card className="border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-amber-500">Upcoming Renewals (next 14 days)</h3>
              </div>
              {stats.upcomingRenewals.map(s => {
                const d = getDaysUntil(s.renewal_date)
                return (
                  <div key={s.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">{s.entity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-amber-500">{fmt(s.monthly_budget)}</span>
                      <Badge variant={d !== null && d <= 3 ? 'destructive' : 'warning'}>
                        {d === 0 ? 'today' : d === 1 ? 'tomorrow' : `${d}d`}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ─── RENDER: SERVICES ───────────────────────────────────────────────
  const renderServices = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
            >
              <option value="All">All Entities</option>
              {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <Button onClick={() => { setEditingService({ ...emptyService }); setServiceModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-3">
            <div className="col-span-3">Service</div>
            <div className="col-span-1">Category</div>
            <div className="col-span-1">Entity</div>
            <div className="col-span-2">Projects</div>
            <div className="col-span-1">Budget</div>
            <div className="col-span-1">Spend</div>
            <div className="col-span-2">Budget %</div>
            <div className="col-span-1">Status</div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {filteredServices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {services.length === 0 ? 'No services yet. Add your first one!' : 'No services match your filters'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredServices.map(s => {
                const overBudget = s.current_spend > s.monthly_budget
                const budgetPct = pct(s.current_spend, s.monthly_budget)
                return (
                  <div
                    key={s.id}
                    className={`grid grid-cols-12 gap-4 py-3 items-center hover:bg-accent/50 rounded-lg px-2 -mx-2 group ${s.status === 'inactive' ? 'opacity-50' : ''}`}
                  >
                    <div className="col-span-3">
                      <div className="flex flex-col gap-0.5">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-500 hover:underline truncate">
                            {s.name}
                          </a>
                        ) : (
                          <span className="font-medium truncate">{s.name}</span>
                        )}
                        {s.notes && <span className="text-xs text-muted-foreground truncate">{s.notes}</span>}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Badge variant="outline" className="text-xs">{s.category}</Badge>
                    </div>
                    <div className="col-span-1 text-sm">{s.entity}</div>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {(s.projects || []).slice(0, 2).map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                      {(s.projects || []).length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{(s.projects || []).length - 2}</Badge>
                      )}
                    </div>
                    <div className="col-span-1 font-mono text-sm">{fmt(s.monthly_budget)}</div>
                    <div className={`col-span-1 font-mono text-sm ${overBudget ? 'text-destructive font-bold' : ''}`}>
                      {fmt(s.current_spend)}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
                        <div
                          className={`h-full rounded ${overBudget ? 'bg-destructive' : budgetPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(budgetPct, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold w-10 ${overBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {budgetPct}%
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center gap-2">
                      <Badge variant={s.status === 'active' ? 'success' : s.status === 'trial' ? 'warning' : 'secondary'}>
                        {s.status}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingService(s); setServiceModalOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ type: 'service', id: s.id, name: s.name })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ─── RENDER: SECRETS ────────────────────────────────────────────────
  const renderSecrets = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {secrets.length} secrets across {Object.keys(groupedSecrets).length} services
          </p>
          {sessionPin ? (
            <Badge variant="success" className="flex items-center gap-1">
              <Lock className="w-3 h-3" /> PIN Active
              <button onClick={() => setSessionPin(null)} className="ml-1 hover:text-destructive">
                <Unlock className="w-3 h-3" />
              </button>
            </Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { setPinAction({ type: 'save' }); setPinModalOpen(true); }}>
              <Lock className="w-3 h-3 mr-1" /> Set PIN
            </Button>
          )}
        </div>
        <Button onClick={() => { setEditingSecret({ ...emptySecret, service_id: services[0]?.id || '' }); setSecretModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Secret
        </Button>
      </div>

      {Object.entries(groupedSecrets).map(([svcName, { secrets: secs }]) => (
        <Card key={svcName}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">{svcName}</span>
              <Badge variant="outline">{secs.length} key{secs.length > 1 ? 's' : ''}</Badge>
            </div>
            <div className="space-y-2">
              {secs.map(sec => {
                const isRevealed = revealedSecrets.has(sec.id)
                const rotatedDays = getDaysUntil(sec.last_rotated)
                const stale = rotatedDays !== null && Math.abs(rotatedDays) > 90
                const displayValue = isRevealed ? revealedSecrets.get(sec.id)! : maskValue(sec.value)
                return (
                  <div
                    key={sec.id}
                    className={`flex items-center gap-3 p-3 bg-secondary/50 rounded-lg ${stale ? 'border border-amber-500/30' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sec.encrypted && <Lock className="w-3 h-3 text-amber-500" />}
                        <code className="text-sm font-semibold text-amber-500">{sec.name}</code>
                        <Badge variant="outline" className="text-xs">{sec.env}</Badge>
                        {stale && <Badge variant="warning" className="text-xs">stale</Badge>}
                      </div>
                      <code className="text-xs text-muted-foreground font-mono block mt-1 truncate">
                        {displayValue}
                      </code>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(sec)} title={isRevealed ? 'Hide' : 'Reveal'}>
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(sec)} title="Copy">
                        {copiedId === sec.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSecret(sec); setSecretModalOpen(true); }} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ type: 'secret', id: sec.id, name: sec.name })} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // ─── RENDER: SPEND ──────────────────────────────────────────────────
  const renderSpend = () => {
    if (!stats) return null
    const sorted = [...services].filter(s => s.status === 'active').sort((a, b) => b.current_spend - a.current_spend)
    return (
      <div className="space-y-4">
        {/* Summary */}
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Monthly Spend</p>
                <p className="text-4xl font-bold text-amber-500 font-mono mt-1">{fmt(stats.totalSpend)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Budget</p>
                <p className="text-4xl font-bold font-mono mt-1">{fmt(stats.totalBudget)}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded overflow-hidden">
                <div
                  className={`h-full rounded ${stats.totalSpend > stats.totalBudget ? 'bg-destructive' : pct(stats.totalSpend, stats.totalBudget) > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(pct(stats.totalSpend, stats.totalBudget), 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {pct(stats.totalSpend, stats.totalBudget)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Ranked list */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">All Active Services - Ranked by Spend</h3>
            {sorted.map((s, i) => {
              const overBudget = s.current_spend > s.monthly_budget
              const budgetPct = pct(s.current_spend, s.monthly_budget)
              return (
                <div key={s.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground font-bold w-6 text-center">#{i + 1}</span>
                  <div className="flex-1">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.entity} - {s.category}</span>
                  </div>
                  <div className="flex items-center gap-3 w-44">
                    <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${overBudget ? 'bg-destructive' : budgetPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold font-mono w-16 text-right ${overBudget ? 'text-destructive' : 'text-amber-500'}`}>
                      {fmt(s.current_spend)}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Service Modal */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent onClose={() => setServiceModalOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService?.id ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Service Name *</label>
                <Input
                  value={editingService?.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g., Anthropic"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">URL</label>
                <Input
                  value={editingService?.url || ''}
                  onChange={(e) => setEditingService({ ...editingService, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={editingService?.category || 'Other'}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Entity</label>
                <select
                  value={editingService?.entity || 'GBI'}
                  onChange={(e) => setEditingService({ ...editingService, entity: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Projects</label>
                <div className="flex flex-wrap gap-2 p-2 bg-secondary/50 rounded-md border border-input min-h-[40px]">
                  {projects.filter(p => p.active).map(p => {
                    const isSelected = (editingService?.projects || []).includes(p.name)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const current = editingService?.projects || []
                          setEditingService({
                            ...editingService,
                            projects: isSelected ? current.filter(n => n !== p.name) : [...current, p.name]
                          })
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-secondary hover:bg-accent text-muted-foreground'
                        }`}
                      >
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Login Method</label>
                <select
                  value={editingService?.login_method || 'GitHub'}
                  onChange={(e) => setEditingService({ ...editingService, login_method: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  {LOGIN_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  value={editingService?.status || 'active'}
                  onChange={(e) => setEditingService({ ...editingService, status: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Monthly Budget ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingService?.monthly_budget || 0}
                  onChange={(e) => setEditingService({ ...editingService, monthly_budget: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Current Spend ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingService?.current_spend || 0}
                  onChange={(e) => setEditingService({ ...editingService, current_spend: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Billing Cycle</label>
                <select
                  value={editingService?.billing_cycle || 'monthly'}
                  onChange={(e) => setEditingService({ ...editingService, billing_cycle: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="usage">Usage Based</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Renewal Date</label>
                <Input
                  type="date"
                  value={editingService?.renewal_date || ''}
                  onChange={(e) => setEditingService({ ...editingService, renewal_date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={editingService?.notes || ''}
                  onChange={(e) => setEditingService({ ...editingService, notes: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input resize-none h-20"
                  placeholder="What's this used for?"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveService} disabled={saving || !editingService?.name}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingService?.id ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Modal */}
      <Dialog open={secretModalOpen} onOpenChange={setSecretModalOpen}>
        <DialogContent onClose={() => setSecretModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSecret?.id ? 'Edit Secret' : 'Add Secret'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Service</label>
              <select
                value={editingSecret?.service_id || ''}
                onChange={(e) => setEditingSecret({ ...editingSecret, service_id: e.target.value })}
                className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
              >
                <option value="">Select a service...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Key Name *</label>
              <Input
                value={editingSecret?.name || ''}
                onChange={(e) => setEditingSecret({ ...editingSecret, name: e.target.value })}
                placeholder="e.g., ANTHROPIC_API_KEY"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Value *</label>
              <Input
                type="password"
                value={editingSecret?.value || ''}
                onChange={(e) => setEditingSecret({ ...editingSecret, value: e.target.value })}
                placeholder="sk-..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Environment</label>
                <select
                  value={editingSecret?.env || 'production'}
                  onChange={(e) => setEditingSecret({ ...editingSecret, env: e.target.value })}
                  className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm border border-input"
                >
                  {ENVS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Last Rotated</label>
                <Input
                  type="date"
                  value={editingSecret?.last_rotated || ''}
                  onChange={(e) => setEditingSecret({ ...editingSecret, last_rotated: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="encrypt-secret"
                checked={editingSecret?.encrypted ?? false}
                onChange={(e) => setEditingSecret({ ...editingSecret, encrypted: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="encrypt-secret" className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                Encrypt with PIN
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSecretModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={() => saveSecret()} disabled={saving || !editingSecret?.name || !editingSecret?.value}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingSecret?.id ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Modal */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent onClose={() => setPinModalOpen(false)} className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              {sessionPin ? 'Enter PIN' : 'Set Session PIN'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              {sessionPin
                ? 'Enter your PIN to decrypt this secret.'
                : 'Create a PIN to encrypt your secrets. You\'ll need this PIN to view or copy encrypted values.'}
            </p>
            <Input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (min 4 characters)"
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPinModalOpen(false); setPinInput(''); }}>Cancel</Button>
            <Button onClick={handlePinSubmit} disabled={pinInput.length < 4}>
              <Lock className="w-4 h-4 mr-2" />
              {sessionPin ? 'Unlock' : 'Set PIN'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent onClose={() => setDeleteConfirm(null)}>
          <DialogHeader>
            <DialogTitle>Delete {deleteConfirm?.type === 'service' ? 'Service' : 'Secret'}?</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
              {deleteConfirm?.type === 'service' && ' This will also delete all associated secrets.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm?.type === 'service') deleteService(deleteConfirm.id)
                else if (deleteConfirm?.type === 'secret') deleteSecret(deleteConfirm.id)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <span className="text-muted-foreground">/</span>
        <span>API Central</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API Central</h1>
            <p className="text-muted-foreground">Hub-and-Spoke Service Manager</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <span className="text-sm text-muted-foreground mr-4">
              {stats.activeServices} active - {fmt(stats.totalSpend)}/mo
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'quick-add' && renderQuickAdd()}
          {activeTab === 'services' && renderServices()}
          {activeTab === 'secrets' && renderSecrets()}
          {activeTab === 'spend' && renderSpend()}
        </>
      )}
    </div>
  )
}
