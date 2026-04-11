import { useOpenIssues } from '@/hooks/useIssues'
import { useMeetingPrepVotes, useMyPrepVotes, useVoteOnIssue, useMarkPrepReady } from '@/hooks/useMeetingPrep'
import { useUsers } from '@/hooks/useMeetings'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Meeting, User } from '@/lib/types'

interface MeetingPrepPanelProps {
  meeting: Meeting
}

const VOTE_LABELS = ['Skip', 'Low', 'Medium', 'Must discuss']
const VOTE_COLORS = [
  'var(--text-tertiary)',
  'var(--priority-fyi)',
  'var(--priority-discuss)',
  'var(--priority-urgent)',
]

export function MeetingPrepPanel({ meeting }: MeetingPrepPanelProps) {
  const { data: issues } = useOpenIssues()
  const { data: allVotes } = useMeetingPrepVotes(meeting.id)
  const { data: myVotes } = useMyPrepVotes(meeting.id)
  const { data: users } = useUsers()
  const voteOnIssue = useVoteOnIssue()
  const markReady = useMarkPrepReady()

  const prepReady = meeting.prep_ready ?? []
  const totalUsers = users?.length ?? 4
  const readyCount = prepReady.length

  const getMyVote = (issueId: string) =>
    myVotes?.find((v) => v.issue_id === issueId)?.priority_vote ?? 0

  const getVoteCount = (issueId: string) =>
    (allVotes ?? []).filter((v) => v.issue_id === issueId && v.priority_vote > 0).length

  const getTotalVoteScore = (issueId: string) =>
    (allVotes ?? []).filter((v) => v.issue_id === issueId).reduce((sum, v) => sum + v.priority_vote, 0)

  const handleVote = (issueId: string, vote: number) => {
    voteOnIssue.mutate(
      { meetingId: meeting.id, issueId, priorityVote: vote },
      { onSuccess: () => toast.success(VOTE_LABELS[vote]) }
    )
  }

  const handleMarkReady = () => {
    markReady.mutate(
      { meetingId: meeting.id, meeting },
      { onSuccess: () => toast.success('Marked as ready') }
    )
  }

  // Sort issues by total vote score (highest first)
  const sortedIssues = [...(issues ?? [])].sort((a, b) => {
    return getTotalVoteScore(b.id) - getTotalVoteScore(a.id)
  })

  return (
    <div
      className="rounded-lg border p-4 mb-6"
      style={{ borderColor: 'var(--accent)', background: 'var(--accent-bg)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Meeting Prep
          </h2>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Vote on which issues to prioritize. {readyCount}/{totalUsers} ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(users ?? []).map((u: User) => (
            <UserAvatar
              key={u.id}
              name={u.short_name}
              color={prepReady.includes(u.id) ? u.color : 'var(--text-tertiary)'}
              size={24}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sortedIssues.map((issue) => {
          const myVote = getMyVote(issue.id)
          const voteCount = getVoteCount(issue.id)

          return (
            <div
              key={issue.id}
              className="flex items-center gap-3 rounded-md px-3 py-2"
              style={{ background: 'var(--bg-primary)' }}
            >
              <PriorityBadge priority={issue.priority} />
              <span className="flex-1 text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>
                {issue.title}
              </span>
              {voteCount > 0 && (
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
                >
                  {voteCount} vote{voteCount !== 1 ? 's' : ''}
                </span>
              )}
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVote(issue.id, v)}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-150"
                    style={{
                      background: myVote === v ? VOTE_COLORS[v] + '20' : 'transparent',
                      color: myVote === v ? VOTE_COLORS[v] : 'var(--text-tertiary)',
                      border: myVote === v ? `1px solid ${VOTE_COLORS[v]}` : '1px solid transparent',
                    }}
                  >
                    {v === 0 ? '—' : v}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={handleMarkReady}
        disabled={markReady.isPending}
        className="mt-3 flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        <Check size={14} />
        I'm ready for the meeting
      </button>
    </div>
  )
}
