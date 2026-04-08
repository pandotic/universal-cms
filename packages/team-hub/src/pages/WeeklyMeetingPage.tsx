import { useCurrentMeeting } from '@/hooks/useMeetings'
import { MeetingView } from '@/components/meeting/MeetingView'

export default function WeeklyMeetingPage() {
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

  if (!meeting) return null

  return <MeetingView meeting={meeting} />
}
