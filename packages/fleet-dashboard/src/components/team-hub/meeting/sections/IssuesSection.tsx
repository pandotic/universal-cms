"use client";

import { useOpenIssues } from '@/hooks/team-hub/useIssues'
import { IssueList } from '@/components/team-hub/issues/IssueList'
import { useOrderedIssues } from '@/components/team-hub/meeting/IssueReorder'
import { useUIStore } from '@/stores/team-hub/ui'

interface IssuesSectionProps {
  meetingId: string
  readOnly?: boolean
}

export function IssuesSection({ meetingId, readOnly }: IssuesSectionProps) {
  const { data: issues, isLoading } = useOpenIssues()
  const openDumpModal = useUIStore((s) => s.openDumpModal)

  // Apply meeting-specific ordering (from prep votes or manual reorder)
  const orderedIssues = useOrderedIssues(readOnly ? undefined : meetingId, issues ?? [])

  return (
    <div>
      <IssueList
        issues={orderedIssues}
        meetingId={readOnly ? undefined : meetingId}
        isLoading={isLoading}
        showReorderControls={!readOnly}
      />
      {!readOnly && (
        <button
          onClick={() => openDumpModal('issue')}
          className="mt-3 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          + Add issue
        </button>
      )}
    </div>
  )
}
