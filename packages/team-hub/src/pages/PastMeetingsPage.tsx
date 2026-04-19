import { Link } from 'react-router-dom'
import { useArchivedMeetings, useUsers } from '@/hooks/useMeetings'
import { useMeetingStats } from '@/hooks/useMeetingStats'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sparkline } from '@/components/ui/Sparkline'
import { Archive } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/types'

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

export default function PastMeetingsPage() {
  const { data: meetings, isLoading } = useArchivedMeetings()
  const { data: stats } = useMeetingStats()
  const { data: users } = useUsers()

  const statsMap = new Map((stats ?? []).map((s) => [s.meeting_id, s]))

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        Past Meetings
      </h1>

      <MeetingMetricsSummary />

      {!meetings?.length ? (
        <EmptyState icon={Archive} message="No archived meetings yet." />
      ) : (
        <div className="space-y-1.5">
          {meetings.map((meeting) => {
            const chair = users?.find((u: User) => u.id === meeting.chair_id)
            const meetingStats = statsMap.get(meeting.id)
            return (
              <Link
                key={meeting.id}
                to={`/meetings/${meeting.id}`}
                className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors duration-150 hover:border-[var(--border-hover)]"
                style={{ borderColor: 'var(--border-default)' }}
              >
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
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
