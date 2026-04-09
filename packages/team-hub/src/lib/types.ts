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
  carry_count: number
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
  current_section: number
  section_started_at: string | null
  timer_paused: boolean
  prep_ready: string[]
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

// Phase 2 types

export interface Note {
  id: string
  text: string
  created_by: string | null
  meeting_id: string | null
  archived: boolean
  created_at: string
}

export interface NoteWithUser extends Note {
  users: Pick<User, 'name' | 'short_name' | 'color'> | null
}

export interface IssueDiscussion {
  id: string
  issue_id: string
  meeting_id: string | null
  note: string
  created_by: string | null
  source: 'manual' | 'transcript'
  created_at: string
}

export interface IssueDiscussionWithUser extends IssueDiscussion {
  users: Pick<User, 'name' | 'short_name' | 'color'> | null
}

export interface MeetingTranscript {
  id: string
  meeting_id: string
  granola_meeting_id: string | null
  granola_url: string | null
  transcript_text: string | null
  ai_summary: string | null
  ai_extracted_todos: ExtractedTodo[]
  ai_extracted_decisions: ExtractedDecision[]
  ai_extracted_commitments: ExtractedCommitment[]
  processed_at: string | null
  created_at: string
}

export interface ExtractedTodo {
  owner: string
  description: string
  due: string | null
  accepted?: boolean
}

export interface ExtractedDecision {
  topic: string
  decision: string
  participants: string[]
}

export interface ExtractedCommitment {
  owner: string
  description: string
  quote: string
  due_description: string | null
  accepted?: boolean
}

export interface Commitment {
  id: string
  meeting_id: string
  owner_id: string | null
  description: string
  source_quote: string | null
  status: 'pending' | 'fulfilled' | 'broken' | 'carried'
  due_description: string | null
  related_todo_id: string | null
  reviewed_in_meeting_id: string | null
  created_at: string
}

export interface CommitmentWithUser extends Commitment {
  users: Pick<User, 'name' | 'short_name' | 'color'> | null
}

export interface WeeklyUserStats {
  user_id: string
  name: string
  short_name: string
  color: string
  todos_completed_this_week: number
  todos_overdue: number
  todos_open: number
  completion_rate_30d: number | null
  chronic_carry_forwards: number
  pending_commitments: number
  broken_commitments: number
}

// Phase 3 types

export interface MeetingPrep {
  id: string
  meeting_id: string
  user_id: string
  issue_id: string
  priority_vote: number
  note: string | null
  created_at: string
}

export interface MeetingPrepWithUser extends MeetingPrep {
  users: Pick<User, 'name' | 'short_name' | 'color'>
}

export interface MeetingIssueOrder {
  id: string
  meeting_id: string
  issue_id: string
  sort_position: number
}

export interface MeetingStats {
  meeting_id: string
  meeting_date: string
  rating: number | null
  chair_id: string | null
  issues_resolved: number
  todos_created: number
  commitments_made: number
}
