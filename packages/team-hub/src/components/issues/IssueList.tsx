import { IssueCard } from './IssueCard'
import { IssueReorderControls } from '@/components/meeting/IssueReorder'
import { EmptyState } from '@/components/ui/EmptyState'
import { CircleDot } from 'lucide-react'
import { useUIStore } from '@/stores/ui'
import type { OpenIssue } from '@/lib/types'

interface IssueListProps {
  issues: OpenIssue[]
  meetingId?: string
  isLoading?: boolean
  showReorderControls?: boolean
}

export function IssueList({ issues, meetingId, isLoading, showReorderControls }: IssueListProps) {
  const openDumpModal = useUIStore((s) => s.openDumpModal)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}
          />
        ))}
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={CircleDot}
        message="No issues yet — dump one above"
        action={{ label: '+ Add issue', onClick: () => openDumpModal('issue') }}
      />
    )
  }

  // When in meeting with reorder controls, show flat list (already ordered)
  if (showReorderControls && meetingId) {
    return (
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div key={issue.id} className="flex items-start gap-1">
            <IssueReorderControls
              meetingId={meetingId}
              issueId={issue.id}
              currentPosition={i}
              totalIssues={issues.length}
            />
            <div className="flex-1">
              <IssueCard issue={issue} meetingId={meetingId} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Standard grouped view
  const urgent = issues.filter((i) => i.priority === 'urgent')
  const discuss = issues.filter((i) => i.priority === 'discuss')
  const fyi = issues.filter((i) => i.priority === 'fyi')

  const groups = [
    { label: 'Urgent', items: urgent },
    { label: 'Discuss', items: discuss },
    { label: 'FYI', items: fyi },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {group.label} ({group.items.length})
          </h3>
          <div className="space-y-2">
            {group.items.map((issue) => (
              <IssueCard key={issue.id} issue={issue} meetingId={meetingId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
