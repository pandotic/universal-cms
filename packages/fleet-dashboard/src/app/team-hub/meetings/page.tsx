"use client";

import Link from "next/link";
import { useCurrentMeeting, useArchivedMeetings, useUsers } from '@/hooks/team-hub/useMeetings'
import { useMeetingStats } from '@/hooks/team-hub/useMeetingStats'
import { MeetingView } from '@/components/team-hub/meeting/MeetingView'
import { MeetingPrepPanel } from '@/components/team-hub/meeting/MeetingPrepPanel'
import { UserAvatar } from '@/components/team-hub/ui/UserAvatar'
import { EmptyState } from '@/components/team-hub/ui/EmptyState'
import { Sparkline } from '@/components/team-hub/ui/Sparkline'
import { Archive } from 'lucide-react'
import { formatDate } from '@/lib/team-hub/utils'
import type { User } from '@/lib/team-hub/types'

function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (!trimmed) return null
  const match = trimmed.slice(0, 240).match(/[^.!?]+[.!?]/)
  return (match ? match[0] : trimmed.slice(0, 200)).trim()
}

function MeetingMetricsSummary() {
  const { data: stats } = useMeetingStats(12)

  if (!stats || stats.length < 2) return null

  const ratings = stats.map((s) => s.rating).reverse()
  const issuesResolved = stats.map((s) => s.issues_resolved).reverse()
  const avgRating = ratings.filter((r): r is number => r !== null).reduce((a, b) => a + b, 0) / (ratings.filter((r) => r !== null).length || 1)
  const avgIssues = issuesResolved.reduce((a, b) => a + b, 0) / issuesResolved.length

  return (
    <div
      className="mb-6 grid grid-cols-3 gap-4 rounded-lg border p-4"
      style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Rating trend
        </p>
        <div className="flex items-center gap-3">
          <Sparkline values={ratings} color="var(--accent)" showDots />
          <span className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {avgRating.toFixed(1)}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Issues resolved / meeting
        </p>
        <div className="flex items-center gap-3">
          <Sparkline values={issuesResolved} color="var(--status-green)" showDots />
          <span className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {avgIssues.toFixed(1)}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Total meetings
        </p>
        <span className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          {stats.length}
        </span>
      </div>
    </div>
  )
}

export default function MeetingsPage() {
  const { data: currentMeeting, isLoading: currentLoading } = useCurrentMeeting()
  const { data: meetings, isLoading } = useArchivedMeetings()
  const { data: stats } = useMeetingStats()
  const { data: users } = useUsers()

  const statsMap = new Map((stats ?? []).map((s) => [s.meeting_id, s]))

  return (
    <div className="space-y-6">
      {/* Current Meeting Section */}
      {!currentLoading && currentMeeting && (
        <div
          className="rounded-lg border p-6"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            This Week's Meeting
          </h2>
          {currentMeeting.status === 'scheduled' && <MeetingPrepPanel meeting={currentMeeting} />}
          <MeetingView meeting={currentMeeting} />
        </div>
      )}

      {/* Past Meetings Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Past Meetings
        </h2>

        <MeetingMetricsSummary />

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
            ))}
          </div>
        ) : !meetings?.length ? (
          <EmptyState icon={Archive} message="No archived meetings yet." />
        ) : (
          <div className="space-y-1.5">
            {meetings.map((meeting) => {
              const chair = users?.find((u: User) => u.id === meeting.chair_id)
              const meetingStats = statsMap.get(meeting.id)
              const summary = firstSentence(meeting.ai_summary)
              return (
                <Link
                  key={meeting.id}
                  href={`/team-hub/meetings/${meeting.id}`}
                  className="flex flex-col gap-1 rounded-lg border px-4 py-3 transition-colors duration-150 hover:border-[var(--border-hover)]"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                    >
                      {formatDate(meeting.meeting_date)}
                    </span>
                    {chair && (
                      <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        <UserAvatar name={chair.short_name} color={chair.color} size={18} />
                        {chair.name}
                      </span>
                    )}
                    {meeting.attendees?.length ? (
                      <span
                        className="flex items-center gap-1"
                        title={(meeting.attendees ?? [])
                          .map((id) => users?.find((u: User) => u.id === id)?.name)
                          .filter(Boolean)
                          .join(', ')}
                      >
                        {(meeting.attendees ?? []).map((id) => {
                          const attendee = users?.find((u: User) => u.id === id)
                          if (!attendee) return null
                          return (
                            <UserAvatar
                              key={id}
                              name={attendee.short_name}
                              color={attendee.color}
                              size={16}
                            />
                          )
                        })}
                      </span>
                    ) : null}
                    {meeting.rating && (
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {meeting.rating}/10
                      </span>
                    )}
                    {meetingStats && (
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {meetingStats.issues_resolved} resolved · {meetingStats.todos_created} to-dos
                      </span>
                    )}
                    <span className="flex-1" />
                    <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                      View &rarr;
                    </span>
                  </div>
                  {summary && (
                    <p
                      className="truncate text-[12px] leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                      title={meeting.ai_summary ?? undefined}
                    >
                      {summary}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
