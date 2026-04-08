import { TodoItem } from './TodoItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { CheckSquare } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import { isOverdue, isDueThisWeek, isDueNextWeek } from '@/lib/utils'
import type { ActiveTodo } from '@/lib/types'

interface TodoListProps {
  todos: ActiveTodo[]
  isLoading?: boolean
  showCarryForward?: boolean
}

export function TodoList({ todos, isLoading, showCarryForward }: TodoListProps) {
  const openDumpModal = useUIStore((s) => s.openDumpModal)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}
          />
        ))}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        message="No to-dos yet — dump one above"
        action={{ label: '+ Add to-do', onClick: () => openDumpModal('todo') }}
      />
    )
  }

  const overdue = todos.filter((t) => t.due_date && isOverdue(t.due_date))
  const thisWeek = todos.filter((t) => t.due_date && !isOverdue(t.due_date) && isDueThisWeek(t.due_date))
  const nextWeek = todos.filter((t) => t.due_date && !isOverdue(t.due_date) && isDueNextWeek(t.due_date))
  const later = todos.filter((t) => t.due_date && !isOverdue(t.due_date) && !isDueThisWeek(t.due_date) && !isDueNextWeek(t.due_date))
  const noDate = todos.filter((t) => !t.due_date)

  const groups = [
    { label: 'Overdue', items: overdue, accent: true },
    { label: 'Due this week', items: thisWeek, accent: false },
    { label: 'Due next week', items: nextWeek, accent: false },
    { label: 'Later', items: later, accent: false },
    { label: 'No due date', items: noDate, accent: false },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: group.accent ? 'var(--priority-urgent)' : 'var(--text-tertiary)' }}
          >
            {group.label} ({group.items.length})
          </h3>
          <div className="space-y-1.5">
            {group.items.map((todo) => (
              <TodoItem key={todo.id} todo={todo} showCarryForward={showCarryForward} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
