import { UserAvatar } from '@/components/ui/UserAvatar'
import { useUpdateMeeting } from '@/hooks/useMeetings'
import type { Meeting, User } from '@/lib/types'

interface AttendancePillsProps {
  meeting: Meeting
  users: User[]
}

export function AttendancePills({ meeting, users }: AttendancePillsProps) {
  const updateMeeting = useUpdateMeeting()

  const toggleAttendee = (userId: string) => {
    const current = meeting.attendees ?? []
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]

    updateMeeting.mutate({ id: meeting.id, attendees: updated })
  }

  return (
    <div className="flex gap-2">
      {users.map((user) => {
        const present = (meeting.attendees ?? []).includes(user.id)
        return (
          <button
            key={user.id}
            onClick={() => toggleAttendee(user.id)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors duration-150"
            style={{
              borderColor: present ? user.color : 'var(--border-default)',
              background: present ? user.color + '15' : 'transparent',
              color: present ? user.color : 'var(--text-tertiary)',
            }}
          >
            <UserAvatar name={user.short_name} color={present ? user.color : 'var(--text-tertiary)'} size={16} />
            {user.name}
          </button>
        )
      })}
    </div>
  )
}
