import { useState } from 'react'
import { useResolveIssue } from '@/hooks/useIssues'
import { TEAM_MEMBERS } from '@/lib/constants'
import { getNextMeetingDate } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ResolveDialogProps {
  issueId: string
  meetingId?: string
  onClose: () => void
}

export function ResolveDialog({ issueId, meetingId, onClose }: ResolveDialogProps) {
  const [resolutionNote, setResolutionNote] = useState('')
  const [createFollowUp, setCreateFollowUp] = useState(false)
  const [todoDescription, setTodoDescription] = useState('')
  const [todoOwner, setTodoOwner] = useState(TEAM_MEMBERS[0].name)
  const [todoDueDate, setTodoDueDate] = useState(format(getNextMeetingDate(), 'yyyy-MM-dd'))

  const resolveIssue = useResolveIssue()

  const handleResolve = () => {
    resolveIssue.mutate(
      {
        issueId,
        resolutionNote: resolutionNote || undefined,
        meetingId,
        followUpTodo: createFollowUp && todoDescription
          ? {
              description: todoDescription,
              ownerName: todoOwner,
              dueDate: todoDueDate,
            }
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Issue resolved')
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border p-5 shadow-2xl"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Resolve issue
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Resolution note
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="How was this resolved?"
              rows={2}
              className="mt-1 w-full resize-none rounded-md border px-3 py-2 text-[13px] outline-none"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createFollowUp}
              onChange={(e) => setCreateFollowUp(e.target.checked)}
              className="rounded"
            />
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Create a follow-up to-do
            </span>
          </label>

          {createFollowUp && (
            <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-secondary)' }}>
              <input
                value={todoDescription}
                onChange={(e) => setTodoDescription(e.target.value)}
                placeholder="To-do description"
                className="w-full rounded-md border px-3 py-1.5 text-[13px] outline-none"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Owner
                  </label>
                  <select
                    value={todoOwner}
                    onChange={(e) => setTodoOwner(e.target.value)}
                    className="mt-1 w-full rounded-md border px-2 py-1.5 text-[13px] outline-none"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Due
                  </label>
                  <input
                    type="date"
                    value={todoDueDate}
                    onChange={(e) => setTodoDueDate(e.target.value)}
                    className="mt-1 w-full rounded-md border px-2 py-1.5 text-[13px] outline-none"
                    style={{
                      borderColor: 'var(--border-default)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium hover:bg-[var(--bg-tertiary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={resolveIssue.isPending}
            className="rounded-md px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--status-green)' }}
          >
            {resolveIssue.isPending ? 'Resolving...' : 'Resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}
