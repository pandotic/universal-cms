"use client";

import { TEAM_MEMBERS } from '@/lib/team-hub/constants'

interface TodoFiltersProps {
  filters: {
    owner: string
    status: string
    source: string
  }
  onChange: (filters: TodoFiltersProps['filters']) => void
}

const selectStyle = {
  borderColor: 'var(--border-default)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
}

export function TodoFilters({ filters, onChange }: TodoFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        value={filters.owner}
        onChange={(e) => onChange({ ...filters, owner: e.target.value })}
        className="rounded-md border px-2 py-1.5 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="all">All owners</option>
        {TEAM_MEMBERS.map((m) => (
          <option key={m.name} value={m.name}>{m.name}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="rounded-md border px-2 py-1.5 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="open">Open</option>
        <option value="all">All statuses</option>
        <option value="done">Done</option>
      </select>

      <select
        value={filters.source}
        onChange={(e) => onChange({ ...filters, source: e.target.value })}
        className="rounded-md border px-2 py-1.5 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="all">All sources</option>
        <option value="manual">Manual</option>
        <option value="dump">Dump</option>
        <option value="meeting">Meeting</option>
        <option value="issue_resolution">Issue resolution</option>
      </select>
    </div>
  )
}
