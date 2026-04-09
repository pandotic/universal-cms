export interface ApiService {
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
  created_at?: string
  updated_at?: string
}

export interface ApiSecret {
  id: string
  service_id: string
  name: string
  value: string
  env: string
  last_rotated?: string
  expires_at?: string
  encrypted?: boolean
  created_at?: string
  updated_at?: string
}

export interface Project {
  id: string
  name: string
  entity: string
  description?: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface ApiCentralStats {
  activeServices: number
  totalServices: number
  totalBudget: number
  totalSpend: number
  overBudgetCount: number
  overBudgetServices: string[]
  secretsCount: number
  servicesWithSecrets: number
  upcomingRenewals: ApiService[]
  byEntity: Record<string, number>
  byCategory: Record<string, number>
}
