import { TEAM_MEMBERS } from '@/lib/constants'

interface IssueFiltersProps {
  filters: {
    status: string
    priority: string
    submitter: string
    source: string
  }
  onChange: (filters: IssueFiltersProps['filters']) => void
}

const selectStyle = {
  borderColor: 'var(--border-default)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
}

export function IssueFilters({ filters, onChange }: IssueFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="rounded-md border px-2 py-1.5 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="open">Open</option>
        <option value="all">All statuses</option>
        <option value="resolved">Resolved</option>
        <option value="deferred">Deferred</option>
        <option value="dropped">Dropped</option>
      </select>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        className="rounded-md border px-2 py-1.5 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="all">All priorities</option>
        <option value="urgent">Urgent</option>
        <option value="discuss">Discuss</option>
        <option value="fyi">FYI</option>
      </select>

      <select
        value={filters.submitter}
        onChange={(e) => onChange({ ...filters, submitter: e.target.value })}
        className="rounded-md border px-2 py-1.5 text-[13px] outline-none"
        style={selectStyle}
      >
        <option value="all">All submitters</option>
        {TEAM_MEMBERS.map((m) => (
          <option key={m.name} value={m.name}>{m.name}</option>
        ))}
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
      </select>
    </div>
  )
}
