import { UserAvatar } from '@/components/ui/UserAvatar'
import { useToggleTodoDone, useCarryForwardTodo } from '@/hooks/useTodos'
import { formatDateShort, isOverdue } from '@/lib/utils'
import { getNextMeetingDate } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ActiveTodo } from '@/lib/types'

interface TodoItemProps {
  todo: ActiveTodo
  showCarryForward?: boolean
}

export function TodoItem({ todo, showCarryForward }: TodoItemProps) {
  const toggleDone = useToggleTodoDone()
  const carryForward = useCarryForwardTodo()

  const handleToggle = () => {
    toggleDone.mutate(
      { id: todo.id, done: true },
      { onSuccess: () => toast.success('To-do completed') }
    )
  }

  const handleCarryForward = () => {
    const nextMeeting = format(getNextMeetingDate(), 'yyyy-MM-dd')
    carryForward.mutate(
      { id: todo.id, newDueDate: nextMeeting },
      { onSuccess: () => toast.success('Carried forward to next meeting') }
    )
  }

  const overdue = isOverdue(todo.due_date)

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-150"
      style={{
        borderColor: overdue ? 'var(--priority-urgent)' : 'var(--border-default)',
        background: overdue ? 'var(--priority-urgent-bg)' : 'transparent',
      }}
    >
      <input
        type="checkbox"
        checked={todo.status === 'done'}
        onChange={handleToggle}
        className="h-4 w-4 rounded cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
          {todo.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {todo.owner_name && todo.owner_short && todo.owner_color && (
          <UserAvatar name={todo.owner_short} color={todo.owner_color} size={20} />
        )}
        {todo.due_date && (
          <span
            className="text-[11px]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: overdue ? 'var(--priority-urgent)' : 'var(--text-tertiary)',
            }}
          >
            {formatDateShort(todo.due_date)}
          </span>
        )}
        {showCarryForward && overdue && (
          <button
            onClick={handleCarryForward}
            disabled={carryForward.isPending}
            className="rounded-md border px-2 py-0.5 text-[11px] font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Carry forward
          </button>
        )}
      </div>
    </div>
  )
}
