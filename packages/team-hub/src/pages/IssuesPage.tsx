import { useState } from 'react'
import { useOpenIssues } from '@/hooks/useIssues'
import { IssueList } from '@/components/issues/IssueList'
import { IssueFilters } from '@/components/issues/IssueFilters'

export default function IssuesPage() {
  const [filters, setFilters] = useState({
    status: 'open',
    priority: 'all',
    submitter: 'all',
    source: 'all',
  })

  const { data: issues, isLoading } = useOpenIssues()

  // Client-side filtering on top of the open_issues view
  const filtered = (issues ?? []).filter((issue) => {
    if (filters.priority !== 'all' && issue.priority !== filters.priority) return false
    if (filters.submitter !== 'all' && issue.submitter_name !== filters.submitter) return false
    if (filters.source !== 'all' && issue.source !== filters.source) return false
    return true
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Issues
        </h1>
        <span
          className="text-[12px]"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
        >
          {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <IssueFilters filters={filters} onChange={setFilters} />
      <IssueList issues={filtered} isLoading={isLoading} />
    </div>
  )
}
