export interface User {
  id: string
  name: string
  email: string
  short_name: string
  color: string
  is_active: boolean
  created_at: string
}

export interface Issue {
  id: string
  title: string
  description: string | null
  submitter_id: string | null
  priority: 'urgent' | 'discuss' | 'fyi'
  status: 'open' | 'resolved' | 'deferred' | 'dropped'
  resolution_note: string | null
  source: 'manual' | 'dump' | 'meeting'
  raw_dump_text: string | null
  ai_classified: boolean
  resolved_at: string | null
  resolved_in_meeting_id: string | null
  created_at: string
  updated_at: string
}

export interface OpenIssue extends Issue {
  submitter_name: string | null
  submitter_short: string | null
  submitter_color: string | null
}

export interface Todo {
  id: string
  description: string
  owner_id: string | null
  due_date: string | null
  status: 'open' | 'done' | 'cancelled'
  source: 'manual' | 'dump' | 'meeting' | 'issue_resolution'
  raw_dump_text: string | null
  ai_classified: boolean
  related_issue_id: string | null
  created_in_meeting_id: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ActiveTodo extends Todo {
  owner_name: string | null
  owner_short: string | null
  owner_color: string | null
  is_overdue: boolean
}

export interface Meeting {
  id: string
  meeting_date: string
  chair_id: string | null
  next_chair_id: string | null
  status: 'scheduled' | 'in_progress' | 'archived'
  rating: number | null
  notes: string | null
  attendees: string[]
  started_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface StandingItemTemplate {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface StandingItem {
  id: string
  meeting_id: string
  template_id: string
  status: 'no_update' | 'update' | 'needs_discussion'
  note: string | null
  updated_at: string
}

export interface StandingItemWithTemplate extends StandingItem {
  standing_item_templates: StandingItemTemplate
}

export interface CommandCenterFlag {
  id: string
  external_id: string | null
  source_type: string | null
  name: string
  ryg_status: 'green' | 'yellow' | 'red' | 'gray' | null
  reason: string | null
  external_url: string | null
  snapshot_date: string
  created_at: string
}

export interface DumpClassification {
  type: 'issue' | 'todo'
  priority: 'urgent' | 'discuss' | 'fyi'
  suggested_title: string
  confidence: number
}
