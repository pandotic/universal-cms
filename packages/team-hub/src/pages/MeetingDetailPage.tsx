import { useParams, Link } from 'react-router-dom'
import { useMeeting } from '@/hooks/useMeetings'
import { MeetingView } from '@/components/meeting/MeetingView'
import { ArrowLeft } from 'lucide-react'

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: meeting, isLoading, error } = useMeeting(id!)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-40 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--border-default)' }}>
        <p className="text-[14px]" style={{ color: 'var(--priority-urgent)' }}>
          Meeting not found
        </p>
        <Link to="/meetings" className="mt-2 inline-block text-[13px]" style={{ color: 'var(--accent)' }}>
          &larr; Back to past meetings
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/meetings"
        className="mb-4 inline-flex items-center gap-1 text-[13px] transition-colors duration-150 hover:opacity-80"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowLeft size={14} />
        Past meetings
      </Link>
      <MeetingView meeting={meeting} readOnly />
    </div>
  )
}
