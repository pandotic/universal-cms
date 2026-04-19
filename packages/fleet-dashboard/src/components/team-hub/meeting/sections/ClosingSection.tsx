"use client";

import { useState } from 'react'
import { useArchiveMeeting, useUsers } from '@/hooks/team-hub/useMeetings'
import { TranscriptSync } from '../TranscriptSync'
import { UserAvatar } from '@/components/team-hub/ui/UserAvatar'
import { toast } from 'sonner'
import type { Meeting, User } from '@/lib/team-hub/types'

interface ClosingSectionProps {
  meeting: Meeting
  readOnly?: boolean
}

export function ClosingSection({ meeting, readOnly }: ClosingSectionProps) {
  const [rating, setRating] = useState(meeting.rating ?? 7)
  const { data: users } = useUsers()
  const archiveMeeting = useArchiveMeeting()

  const nextChair = users?.find((u: User) => u.id === meeting.next_chair_id)

  const handleArchive = () => {
    if (!confirm('Archive this meeting? A new meeting will be created for next week.')) return
    archiveMeeting.mutate(
      { meetingId: meeting.id, rating },
      {
        onSuccess: () => toast.success('Meeting archived. Next week\'s meeting created.'),
      }
    )
  }

  if (readOnly) {
    return (
      <div className="space-y-3">
        {meeting.rating && (
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Meeting rating: <strong style={{ fontFamily: 'var(--font-mono)' }}>{meeting.rating}/10</strong>
          </p>
        )}
        <TranscriptSync meetingId={meeting.id} readOnly />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Transcript sync — do this before archiving */}
      <TranscriptSync meetingId={meeting.id} />

      <div className="border-t pt-4" style={{ borderColor: 'var(--border-default)' }}>
        {nextChair && (
          <div className="flex items-center gap-2 text-[13px] mb-4" style={{ color: 'var(--text-secondary)' }}>
            Next chair:
            <UserAvatar name={nextChair.short_name} color={nextChair.color} size={20} />
            <span className="font-medium">{nextChair.name}</span>
          </div>
        )}

        <div>
          <label className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Rate this meeting
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="flex-1"
            />
            <span
              className="w-8 text-center text-[14px] font-semibold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
            >
              {rating}
            </span>
          </div>
        </div>

        <button
          onClick={handleArchive}
          disabled={archiveMeeting.isPending}
          className="mt-4 rounded-md px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {archiveMeeting.isPending ? 'Archiving...' : 'Archive meeting'}
        </button>
      </div>
    </div>
  )
}
