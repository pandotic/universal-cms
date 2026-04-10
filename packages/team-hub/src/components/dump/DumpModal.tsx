import { useEffect, useRef, useState, useCallback } from 'react'
import { useUIStore } from '@/stores/ui'
import { useCurrentUserStore } from '@/stores/currentUser'
import { useDumpClassify } from '@/hooks/useDumpClassify'
import { useCreateIssue } from '@/hooks/useIssues'
import { useCreateTodo } from '@/hooks/useTodos'
import { AiClassificationPanel } from './AiClassificationPanel'
import { TEAM_MEMBERS } from '@/lib/constants'
import { getNextMeetingDate, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { DumpClassification } from '@/lib/types'

type DumpType = 'issue' | 'todo' | null

export function DumpModal() {
  const { isDumpModalOpen, dumpModalPresetType, closeDumpModal } = useUIStore()
  const currentUser = useCurrentUserStore((s) => s.currentUser)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [text, setText] = useState('')
  const [selectedType, setSelectedType] = useState<DumpType>(null)
  const [classification, setClassification] = useState<DumpClassification | null>(null)
  const [aiAccepted, setAiAccepted] = useState(false)

  // Issue fields
  const [priority, setPriority] = useState<'urgent' | 'discuss' | 'fyi'>('discuss')

  // To-do fields
  const [owner, setOwner] = useState(currentUser.name)
  const [dueDate, setDueDate] = useState(formatDate(getNextMeetingDate()))

  const classify = useDumpClassify()
  const createIssue = useCreateIssue()
  const createTodo = useCreateTodo()

  // Reset state when modal opens
  useEffect(() => {
    if (isDumpModalOpen) {
      setText('')
      setClassification(null)
      setAiAccepted(false)
      setOwner(currentUser.name)
      setDueDate(formatDate(getNextMeetingDate()))
      setPriority('discuss')

      if (dumpModalPresetType === 'issue') {
        setSelectedType('issue')
      } else if (dumpModalPresetType === 'todo') {
        setSelectedType('todo')
      } else {
        setSelectedType(null)
      }

      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isDumpModalOpen, dumpModalPresetType, currentUser.name])

  const effectiveType = aiAccepted && classification ? classification.type : selectedType

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return

    // If no type selected and no AI classification yet, run classification
    if (!effectiveType && !classification) {
      try {
        const result = await classify.mutateAsync(text)
        setClassification(result)
      } catch {
        toast.error('Classification failed. Please select a type manually.')
      }
      return
    }

    if (effectiveType === 'issue') {
      const title = classification?.suggested_title ?? text.trim().slice(0, 80)
      createIssue.mutate(
        {
          title,
          description: text.trim(),
          priority: classification?.priority ?? priority,
          source: 'dump',
          raw_dump_text: text,
          ai_classified: !!classification,
        },
        {
          onSuccess: () => {
            toast.success('Added to issues list')
            closeDumpModal()
          },
        }
      )
    } else if (effectiveType === 'todo') {
      createTodo.mutate(
        {
          description: text.trim(),
          source: 'dump',
          raw_dump_text: text,
          ai_classified: !!classification,
        },
        {
          onSuccess: () => {
            toast.success('Added to to-dos')
            closeDumpModal()
          },
        }
      )
    }
  }, [text, effectiveType, classification, priority, classify, createIssue, createTodo, closeDumpModal, owner, dueDate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDumpModal()
      }
    },
    [handleSubmit, closeDumpModal]
  )

  if (!isDumpModalOpen) return null

  const isSubmitting = classify.isPending || createIssue.isPending || createTodo.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={closeDumpModal}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border shadow-2xl"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border-default)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            DUMP IT
          </h2>
          <kbd
            className="rounded border px-1.5 py-0.5 text-[11px]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Esc
          </kbd>
        </div>

        <div className="p-5 space-y-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full resize-none rounded-md border px-3 py-2 text-[14px] outline-none transition-colors duration-150 focus:border-[var(--accent)]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />

          {/* Type selector */}
          {!classification && (
            <div>
              <p className="mb-2 text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Type
              </p>
              <div className="flex gap-2">
                {(['issue', 'todo'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(selectedType === type ? null : type)}
                    className="rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150"
                    style={{
                      borderColor: selectedType === type ? 'var(--accent)' : 'var(--border-default)',
                      background: selectedType === type ? 'var(--accent-bg)' : 'transparent',
                      color: selectedType === type ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {type === 'issue' ? 'Issue' : 'To-do'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI classification result */}
          {classification && !aiAccepted && (
            <AiClassificationPanel
              classification={classification}
              onAccept={() => setAiAccepted(true)}
              onChange={() => {
                setClassification(null)
                setAiAccepted(false)
              }}
            />
          )}

          {/* Issue-specific fields */}
          {effectiveType === 'issue' && (
            <div>
              <p className="mb-2 text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Priority
              </p>
              <div className="flex gap-2">
                {(['urgent', 'discuss', 'fyi'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className="rounded-md border px-3 py-1.5 text-[13px] font-medium capitalize transition-colors duration-150"
                    style={{
                      borderColor: priority === p ? 'var(--accent)' : 'var(--border-default)',
                      background: priority === p ? 'var(--accent-bg)' : 'transparent',
                      color: priority === p ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* To-do specific fields */}
          {effectiveType === 'todo' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="mb-1 text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Owner
                </p>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full rounded-md border px-3 py-1.5 text-[13px] outline-none"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Due
                </p>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border px-3 py-1.5 text-[13px] outline-none"
                  style={{
                    borderColor: 'var(--border-default)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Submitted by */}
          <div>
            <p className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Submitted by: <span style={{ color: 'var(--text-secondary)' }}>{currentUser.name}</span>
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-between border-t px-5 py-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={closeDumpModal}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="rounded-md px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-150 disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {isSubmitting ? 'Saving...' : classify.isPending ? 'Classifying...' : 'Submit'}
            <span className="ml-2 text-[11px] opacity-70">Cmd+Enter</span>
          </button>
        </div>
      </div>
    </div>
  )
}
