import { formatDate } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { AttendancePills } from './AttendancePills'
import { useUpdateMeeting } from '@/hooks/useMeetings'
import { useUsers } from '@/hooks/useMeetings'
import { AGENDA_SECTIONS } from '@/lib/constants'
import { Play, SkipForward, Pause } from 'lucide-react'
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

  const handleStartTimer = () => {
    updateMeeting.mutate({
      id: meeting.id,
      current_section: 0,
      section_started_at: new Date().toISOString(),
      timer_paused: false,
    })
  }

  const handleNextSection = () => {
    const next = (meeting.current_section ?? 0) + 1
    if (next >= AGENDA_SECTIONS.length) return
    updateMeeting.mutate({
      id: meeting.id,
      current_section: next,
      section_started_at: new Date().toISOString(),
      timer_paused: false,
    })
  }

  const handleTogglePause = () => {
    updateMeeting.mutate({
      id: meeting.id,
      timer_paused: !meeting.timer_paused,
      ...(meeting.timer_paused ? { section_started_at: new Date().toISOString() } : {}),
    })
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

        <div className="flex items-center gap-2">
          {!readOnly && meeting.status === 'scheduled' && (
            <button
              onClick={handleStartMeeting}
              className="rounded-md px-4 py-1.5 text-[13px] font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              Start meeting
            </button>
          )}

          {!readOnly && meeting.status === 'in_progress' && (
            <>
              {!meeting.section_started_at ? (
                <button
                  onClick={handleStartTimer}
                  className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <Play size={12} /> Start timer
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTogglePause}
                    className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    <Pause size={12} /> {meeting.timer_paused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleNextSection}
                    disabled={(meeting.current_section ?? 0) >= AGENDA_SECTIONS.length - 1}
                    className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
                    style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    <SkipForward size={12} /> Next
                  </button>
                </>
              )}
              <span
                className="rounded-full px-3 py-1 text-[12px] font-medium"
                style={{ background: 'var(--status-green)', color: 'white' }}
              >
                Live
              </span>
            </>
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
