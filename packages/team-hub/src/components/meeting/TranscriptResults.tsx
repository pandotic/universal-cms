import { useState } from 'react'
import { useAcceptTranscriptItems } from '@/hooks/useTranscript'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { TEAM_MEMBERS } from '@/lib/constants'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { MeetingTranscript, ExtractedTodo, ExtractedCommitment } from '@/lib/types'

interface TranscriptResultsProps {
  transcript: MeetingTranscript
  meetingId: string
}

export function TranscriptResults({ transcript, meetingId }: TranscriptResultsProps) {
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(
    new Set(transcript.ai_extracted_todos.map((_, i) => i))
  )
  const [selectedCommitments, setSelectedCommitments] = useState<Set<number>>(
    new Set(transcript.ai_extracted_commitments.map((_, i) => i))
  )
  const acceptItems = useAcceptTranscriptItems()

  const toggleTodo = (i: number) => {
    const next = new Set(selectedTodos)
    next.has(i) ? next.delete(i) : next.add(i)
    setSelectedTodos(next)
  }

  const toggleCommitment = (i: number) => {
    const next = new Set(selectedCommitments)
    next.has(i) ? next.delete(i) : next.add(i)
    setSelectedCommitments(next)
  }

  const handleAccept = () => {
    const todos = transcript.ai_extracted_todos
      .filter((_: ExtractedTodo, i: number) => selectedTodos.has(i))
      .map((t: ExtractedTodo) => ({ owner: t.owner, description: t.description, due: t.due }))

    const commitments = transcript.ai_extracted_commitments
      .filter((_: ExtractedCommitment, i: number) => selectedCommitments.has(i))
      .map((c: ExtractedCommitment) => ({
        owner: c.owner,
        description: c.description,
        quote: c.quote,
        due_description: c.due_description,
      }))

    acceptItems.mutate(
      { meetingId, todos, commitments, issueNotes: [] },
      { onSuccess: () => toast.success(`Created ${todos.length} to-dos, ${commitments.length} commitments`) }
    )
  }

  const getMemberColor = (name: string) =>
    TEAM_MEMBERS.find((m) => m.name === name)?.color ?? 'var(--text-tertiary)'
  const getMemberShort = (name: string) =>
    TEAM_MEMBERS.find((m) => m.name === name)?.shortName ?? name.charAt(0)

  const hasTodos = transcript.ai_extracted_todos.length > 0
  const hasCommitments = transcript.ai_extracted_commitments.length > 0
  const hasDecisions = transcript.ai_extracted_decisions.length > 0

  if (!hasTodos && !hasCommitments && !hasDecisions) return null

  return (
    <div className="space-y-4">
      {hasTodos && (
        <div>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Extracted To-dos ({selectedTodos.size}/{transcript.ai_extracted_todos.length})
          </h4>
          <div className="space-y-1">
            {transcript.ai_extracted_todos.map((todo: ExtractedTodo, i: number) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 cursor-pointer"
                style={{
                  background: selectedTodos.has(i) ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                  opacity: selectedTodos.has(i) ? 1 : 0.5,
                }}
                onClick={() => toggleTodo(i)}
              >
                {selectedTodos.has(i) ? (
                  <Check size={14} style={{ color: 'var(--accent)' }} />
                ) : (
                  <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                )}
                <UserAvatar name={getMemberShort(todo.owner)} color={getMemberColor(todo.owner)} size={18} />
                <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                  {todo.description}
                </span>
                {todo.due && (
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {todo.due}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCommitments && (
        <div>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Extracted Commitments ({selectedCommitments.size}/{transcript.ai_extracted_commitments.length})
          </h4>
          <div className="space-y-1">
            {transcript.ai_extracted_commitments.map((c: ExtractedCommitment, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md px-3 py-1.5 cursor-pointer"
                style={{
                  background: selectedCommitments.has(i) ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                  opacity: selectedCommitments.has(i) ? 1 : 0.5,
                }}
                onClick={() => toggleCommitment(i)}
              >
                {selectedCommitments.has(i) ? (
                  <Check size={14} className="mt-0.5" style={{ color: 'var(--accent)' }} />
                ) : (
                  <X size={14} className="mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                )}
                <div>
                  <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                    <strong>{c.owner}:</strong> {c.description}
                  </p>
                  <p className="text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>
                    "{c.quote}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasDecisions && (
        <div>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Decisions Made
          </h4>
          <div className="space-y-1">
            {transcript.ai_extracted_decisions.map((d, i) => (
              <div
                key={i}
                className="rounded-md px-3 py-1.5"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                  <strong>{d.topic}:</strong> {d.decision}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(hasTodos || hasCommitments) && (
        <button
          onClick={handleAccept}
          disabled={acceptItems.isPending || (selectedTodos.size === 0 && selectedCommitments.size === 0)}
          className="rounded-md px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {acceptItems.isPending ? 'Creating...' : `Accept ${selectedTodos.size} to-dos, ${selectedCommitments.size} commitments`}
        </button>
      )}
    </div>
  )
}
