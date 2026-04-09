import { useState } from 'react'
import { useActiveTodos } from '@/hooks/useTodos'
import { TodoList } from '@/components/todos/TodoList'
import { TodoFilters } from '@/components/todos/TodoFilters'

export default function TodosPage() {
  const [filters, setFilters] = useState({
    owner: 'all',
    status: 'open',
    source: 'all',
  })

  const { data: todos, isLoading } = useActiveTodos()

  // Client-side filtering
  const filtered = (todos ?? []).filter((todo) => {
    if (filters.owner !== 'all' && todo.owner_name !== filters.owner) return false
    if (filters.source !== 'all' && todo.source !== filters.source) return false
    return true
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          To-dos
        </h1>
        <span
          className="text-[12px]"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
        >
          {filtered.length} to-do{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <TodoFilters filters={filters} onChange={setFilters} />
      <TodoList todos={filtered} isLoading={isLoading} showCarryForward />
    </div>
  )
}
