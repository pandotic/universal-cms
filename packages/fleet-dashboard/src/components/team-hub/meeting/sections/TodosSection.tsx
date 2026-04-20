"use client";

import { useActiveTodos } from '@/hooks/team-hub/useTodos'
import { TodoItem } from '@/components/team-hub/todos/TodoItem'
import { EmptyState } from '@/components/team-hub/ui/EmptyState'
import { useUIStore } from '@/stores/team-hub/ui'
import { CheckSquare } from 'lucide-react'
import type { ActiveTodo } from '@/lib/team-hub/types'

interface TodosSectionProps {
  meetingId: string
  readOnly?: boolean
}

export function TodosSection({ meetingId, readOnly }: TodosSectionProps) {
  const { data: todos, isLoading } = useActiveTodos()
  const openDumpModal = useUIStore((s) => s.openDumpModal)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
      </div>
    )
  }

  const overdue = (todos ?? []).filter((t: ActiveTodo) => t.is_overdue)
  const meetingTodos = (todos ?? []).filter((t: ActiveTodo) => t.created_in_meeting_id === meetingId)
  const otherActive = (todos ?? []).filter(
    (t: ActiveTodo) => !t.is_overdue && t.created_in_meeting_id !== meetingId
  )

  const hasContent = overdue.length > 0 || meetingTodos.length > 0 || otherActive.length > 0

  if (!hasContent) {
    return (
      <EmptyState
        icon={CheckSquare}
        message="No to-dos for this meeting yet"
        action={!readOnly ? { label: '+ Add to-do', onClick: () => openDumpModal('todo') } : undefined}
      />
    )
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <div>
          <h4
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--priority-urgent)' }}
          >
            Overdue from last week ({overdue.length})
          </h4>
          <div className="space-y-1.5">
            {overdue.map((todo: ActiveTodo) => (
              <TodoItem key={todo.id} todo={todo} showCarryForward={!readOnly} />
            ))}
          </div>
        </div>
      )}

      {meetingTodos.length > 0 && (
        <div>
          <h4
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            This meeting's to-dos ({meetingTodos.length})
          </h4>
          <div className="space-y-1.5">
            {meetingTodos.map((todo: ActiveTodo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}

      {otherActive.length > 0 && (
        <div>
          <h4
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Other active to-dos ({otherActive.length})
          </h4>
          <div className="space-y-1.5">
            {otherActive.map((todo: ActiveTodo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <button
          onClick={() => openDumpModal('todo')}
          className="rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          + Add to-do
        </button>
      )}
    </div>
  )
}
