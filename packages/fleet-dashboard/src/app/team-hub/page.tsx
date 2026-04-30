"use client";

import { useCurrentMeeting } from '@/hooks/team-hub/useMeetings'
import { MeetingView } from '@/components/team-hub/meeting/MeetingView'
import { MeetingPrepPanel } from '@/components/team-hub/meeting/MeetingPrepPanel'
import { PersonalAlerts } from './components/personal-alerts'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function TeamHubOverviewPage() {
  const { data: meeting, isLoading, error } = useCurrentMeeting()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-40 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-60 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--border-default)' }}>
        <p className="text-[14px]" style={{ color: 'var(--priority-urgent)' }}>
          Failed to load meeting
        </p>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          {error instanceof Error ? error.message : 'Check your Supabase connection.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Team Hub Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Your team status at a glance
        </p>
      </div>

      {/* Current meeting section */}
      {meeting && (
        <div
          className="rounded-lg border p-6"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {meeting.status === 'scheduled' ? 'This Week\'s Meeting' : 'Weekly Meeting'}
            </h2>
          </div>

          {meeting.status === 'scheduled' && <MeetingPrepPanel meeting={meeting} />}
          <MeetingView meeting={meeting} />
        </div>
      )}

      {/* Personal Items section */}
      <div
        className="rounded-lg border p-6"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Your Items
        </h2>
        <PersonalAlerts />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/team-hub/issues"
          className="text-sm px-3 py-2 rounded transition-colors"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--accent)',
            border: '1px solid var(--border-default)',
          }}
        >
          View all issues
        </Link>
        <Link
          href="/team-hub/todos"
          className="text-sm px-3 py-2 rounded transition-colors"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--accent)',
            border: '1px solid var(--border-default)',
          }}
        >
          View all to-dos
        </Link>
        <Link
          href="/team-hub/initiatives"
          className="text-sm px-3 py-2 rounded transition-colors"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--accent)',
            border: '1px solid var(--border-default)',
          }}
        >
          View initiatives
        </Link>
      </div>
    </div>
  )
}
