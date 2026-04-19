import { useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useIssueOrder, useReorderIssue } from '@/hooks/useIssueOrder'
import { useMeetingPrepVotes } from '@/hooks/useMeetingPrep'
import type { OpenIssue } from '@/lib/types'

export function useOrderedIssues(meetingId: string | undefined, issues: OpenIssue[]): OpenIssue[] {
  const { data: order } = useIssueOrder(meetingId)
  const { data: prepVotes } = useMeetingPrepVotes(meetingId)

  return useMemo(() => {
    if (!issues.length) return issues

    // If we have explicit ordering, use it
    if (order && order.length > 0) {
      const orderMap = new Map(order.map((o) => [o.issue_id, o.sort_position]))
      return [...issues].sort((a, b) => {
        const posA = orderMap.get(a.id) ?? 999
        const posB = orderMap.get(b.id) ?? 999
        return posA - posB
      })
    }

    // Otherwise, sort by prep vote score (highest first), then by default priority
    if (prepVotes && prepVotes.length > 0) {
      const scoreMap = new Map<string, number>()
      for (const vote of prepVotes) {
        scoreMap.set(vote.issue_id, (scoreMap.get(vote.issue_id) ?? 0) + vote.priority_vote)
      }
      return [...issues].sort((a, b) => {
        const scoreA = scoreMap.get(a.id) ?? 0
        const scoreB = scoreMap.get(b.id) ?? 0
        if (scoreB !== scoreA) return scoreB - scoreA
        // Fall back to default priority order
        const prio = { urgent: 0, discuss: 1, fyi: 2 }
        return prio[a.priority] - prio[b.priority]
      })
    }

    return issues
  }, [issues, order, prepVotes])
}

export function IssueReorderControls({ meetingId, issueId, currentPosition, totalIssues }: {
  meetingId: string
  issueId: string
  currentPosition: number
  totalIssues: number
}) {
  const reorder = useReorderIssue()

  const moveUp = () => {
    if (currentPosition <= 0) return
    reorder.mutate({ meetingId, issueId, newPosition: currentPosition - 1 })
  }

  const moveDown = () => {
    if (currentPosition >= totalIssues - 1) return
    reorder.mutate({ meetingId, issueId, newPosition: currentPosition + 1 })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={moveUp}
        disabled={currentPosition <= 0}
        className="rounded p-0.5 transition-colors duration-150 hover:bg-[var(--bg-tertiary)] disabled:opacity-20"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronUp size={12} />
      </button>
      <button
        onClick={moveDown}
        disabled={currentPosition >= totalIssues - 1}
        className="rounded p-0.5 transition-colors duration-150 hover:bg-[var(--bg-tertiary)] disabled:opacity-20"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronDown size={12} />
      </button>
    </div>
  )
}
