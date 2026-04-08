import { Link } from 'react-router-dom'
import { useArchivedMeetings, useUsers } from '@/hooks/useMeetings'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Archive } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/types'

export default function PastMeetingsPage() {
  const { data: meetings, isLoading } = useArchivedMeetings()
  const { data: users } = useUsers()

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

      {!meetings?.length ? (
        <EmptyState icon={Archive} message="No archived meetings yet." />
      ) : (
        <div className="space-y-1.5">
          {meetings.map((meeting) => {
            const chair = users?.find((u: User) => u.id === meeting.chair_id)
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
                {meeting.rating && (
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                  >
                    {meeting.rating}/10
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
