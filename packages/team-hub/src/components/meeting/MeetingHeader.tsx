import { formatDate } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { AttendancePills } from './AttendancePills'
import { useUpdateMeeting } from '@/hooks/useMeetings'
import { useUsers } from '@/hooks/useMeetings'
import { toast } from 'sonner'
import type { Meeting, User } from '@/lib/types'

interface MeetingHeaderProps {
  meeting: Meeting
  readOnly?: boolean
}

export function MeetingHeader({ meeting, readOnly }: MeetingHeaderProps) {
  const { data: users } = useUsers()
  const updateMeeting = useUpdateMeeting()

  const chair = users?.find((u: User) => u.id === meeting.chair_id)
  const nextChair = users?.find((u: User) => u.id === meeting.next_chair_id)

  const handleStartMeeting = () => {
    updateMeeting.mutate(
      { id: meeting.id, status: 'in_progress', started_at: new Date().toISOString() },
      { onSuccess: () => toast.success('Meeting started') }
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Weekly Meeting
          </h1>
          <p
            className="text-[13px]"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
          >
            {formatDate(meeting.meeting_date)}
          </p>
        </div>

        {!readOnly && meeting.status === 'scheduled' && (
          <button
            onClick={handleStartMeeting}
            className="rounded-md px-4 py-1.5 text-[13px] font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            Start meeting
          </button>
        )}

        {meeting.status === 'in_progress' && (
          <span
            className="rounded-full px-3 py-1 text-[12px] font-medium"
            style={{ background: 'var(--status-green)', color: 'white' }}
          >
            In progress
          </span>
        )}

        {meeting.status === 'archived' && (
          <span
            className="rounded-full px-3 py-1 text-[12px] font-medium"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
          >
            Archived
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {chair && (
          <span className="flex items-center gap-1.5">
            Chair:
            <UserAvatar name={chair.short_name} color={chair.color} size={20} />
            <span className="font-medium">{chair.name}</span>
          </span>
        )}
        {nextChair && (
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Next:
            <UserAvatar name={nextChair.short_name} color={nextChair.color} size={18} />
            {nextChair.name}
          </span>
        )}
      </div>

      {!readOnly && (
        <div className="mt-3">
          <AttendancePills meeting={meeting} users={users ?? []} />
        </div>
      )}
    </div>
  )
}
