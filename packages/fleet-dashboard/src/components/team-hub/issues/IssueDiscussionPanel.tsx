"use client";

import { useState } from 'react'
import { useIssueDiscussions, useAddIssueDiscussion } from '@/hooks/team-hub/useIssueDiscussions'
import { UserAvatar } from '@/components/team-hub/ui/UserAvatar'
import { timeAgo } from '@/lib/team-hub/utils'
import { toast } from 'sonner'

interface IssueDiscussionPanelProps {
  issueId: string
  meetingId?: string
  readOnly?: boolean
}

export function IssueDiscussionPanel({ issueId, meetingId, readOnly }: IssueDiscussionPanelProps) {
  const { data: discussions, isLoading } = useIssueDiscussions(issueId)
  const addDiscussion = useAddIssueDiscussion()
  const [newNote, setNewNote] = useState('')

  const handleAdd = () => {
    if (!newNote.trim()) return
    addDiscussion.mutate(
      { issueId, note: newNote.trim(), meetingId },
      {
        onSuccess: () => {
          setNewNote('')
          toast.success('Note added')
        },
      }
    )
  }

  if (isLoading) {
    return <div className="h-8 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} />
  }

  return (
    <div className="mt-2 space-y-2">
      {(discussions ?? []).map((d) => (
        <div key={d.id} className="flex items-start gap-2 pl-1">
          {d.users && (
            <UserAvatar name={d.users.short_name} color={d.users.color} size={16} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {d.note}
            </p>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{timeAgo(d.created_at)}</span>
              {d.source === 'transcript' && (
                <span className="rounded px-1 py-0.5" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                  transcript
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a discussion note..."
            className="flex-1 rounded-md border px-2 py-1 text-[12px] outline-none"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!newNote.trim() || addDiscussion.isPending}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
