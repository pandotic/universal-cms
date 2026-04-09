export const PRIORITIES = ['urgent', 'discuss', 'fyi'] as const
export type Priority = (typeof PRIORITIES)[number]

export const ISSUE_STATUSES = ['open', 'resolved', 'deferred', 'dropped'] as const
export type IssueStatus = (typeof ISSUE_STATUSES)[number]

export const TODO_STATUSES = ['open', 'done', 'cancelled'] as const
export type TodoStatus = (typeof TODO_STATUSES)[number]

export const MEETING_STATUSES = ['scheduled', 'in_progress', 'archived'] as const
export type MeetingStatus = (typeof MEETING_STATUSES)[number]

export const SOURCES = ['manual', 'dump', 'meeting', 'issue_resolution'] as const
export type Source = (typeof SOURCES)[number]

export const STANDING_ITEM_STATUSES = ['no_update', 'update', 'needs_discussion'] as const
export type StandingItemStatus = (typeof STANDING_ITEM_STATUSES)[number]

export const TEAM_MEMBERS = [
  { name: 'Allen', email: 'allen@pandotic.com', shortName: 'A', color: '#7F77DD' },
  { name: 'Matt', email: 'matt@pandotic.com', shortName: 'M', color: '#1D9E75' },
  { name: 'Dan', email: 'dan@pandotic.com', shortName: 'D', color: '#D4537E' },
  { name: 'Scott', email: 'scott@pandotic.com', shortName: 'S', color: '#BA7517' },
] as const

export const AGENDA_SECTIONS = [
  { number: '01', title: 'Company health', timeBudget: '5 min' },
  { number: '02', title: 'Command Center review', timeBudget: '10 min' },
  { number: '03', title: 'Issues list — IDS', timeBudget: '15 min' },
  { number: '04', title: 'To-dos', timeBudget: '5 min' },
  { number: '05', title: 'Closing', timeBudget: '1 min' },
] as const
