"use client";

import { useNotes } from '@/hooks/team-hub/useNotes'
import { UserAvatar } from '@/components/team-hub/ui/UserAvatar'
import { EmptyState } from '@/components/team-hub/ui/EmptyState'
import { useUIStore } from '@/stores/team-hub/ui'
import { StickyNote } from 'lucide-react'
import { timeAgo } from '@/lib/team-hub/utils'

interface NotesSectionProps {
  meetingId: string
  readOnly?: boolean
}

export function NotesSection({ meetingId, readOnly }: NotesSectionProps) {
  const { data: notes, isLoading } = useNotes(meetingId)
  const openDumpModal = useUIStore((s) => s.openDumpModal)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
      </div>
    )
  }

  if (!notes?.length) {
    return (
      <EmptyState
        icon={StickyNote}
        message="No notes this week"
        action={!readOnly ? { label: '+ Add a note', onClick: () => openDumpModal('note') } : undefined}
      />
    )
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div
          key={note.id}
          className="flex items-start gap-2 rounded-md px-3 py-2"
          style={{ background: 'var(--bg-secondary)' }}
        >
          {note.users && (
            <UserAvatar name={note.users.short_name} color={note.users.color} size={20} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
              {note.text}
            </p>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {timeAgo(note.created_at)}
            </span>
          </div>
        </div>
      ))}
      {!readOnly && (
        <button
          onClick={() => openDumpModal('note')}
          className="rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          + Add a note
        </button>
      )}
    </div>
  )
}
