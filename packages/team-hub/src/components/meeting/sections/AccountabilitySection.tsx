import { useWeeklyUserStats, usePendingCommitments, useUpdateCommitment } from '@/hooks/useAccountability'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { CommitmentReview } from '../CommitmentReview'
import type { WeeklyUserStats } from '@/lib/types'

interface AccountabilitySectionProps {
  meetingId: string
  readOnly?: boolean
}

function CompletionBar({ rate }: { rate: number | null }) {
  const pct = rate ?? 0
  const color = pct >= 90 ? 'var(--status-green)' : pct >= 70 ? 'var(--status-yellow)' : 'var(--status-red)'

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="w-10 text-right text-[11px] font-semibold"
        style={{ fontFamily: 'var(--font-mono)', color }}
      >
        {pct}%
      </span>
    </div>
  )
}

function UserStatsRow({ stats }: { stats: WeeklyUserStats }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <UserAvatar name={stats.short_name} color={stats.color} size={24} />
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {stats.name}
        </span>
      </div>

      <div className="mb-2">
        <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
          30-day completion rate
        </p>
        <CompletionBar rate={stats.completion_rate_30d} />
      </div>

      <div className="flex gap-4 text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          {stats.todos_completed_this_week} done this week
        </span>
        {stats.todos_overdue > 0 && (
          <span style={{ color: 'var(--priority-urgent)' }}>
            {stats.todos_overdue} overdue
          </span>
        )}
        {stats.chronic_carry_forwards > 0 && (
          <span style={{ color: 'var(--priority-discuss)' }}>
            {stats.chronic_carry_forwards} carried 2+ times
          </span>
        )}
        {stats.pending_commitments > 0 && (
          <span style={{ color: 'var(--accent)' }}>
            {stats.pending_commitments} pending commitments
          </span>
        )}
      </div>
    </div>
  )
}

export function AccountabilitySection({ meetingId, readOnly }: AccountabilitySectionProps) {
  const { data: stats, isLoading: statsLoading } = useWeeklyUserStats()
  const { data: commitments, isLoading: commitmentsLoading } = usePendingCommitments(meetingId)

  if (statsLoading || commitmentsLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Completion rates per person */}
      <div className="grid grid-cols-2 gap-3">
        {(stats ?? []).map((s) => (
          <UserStatsRow key={s.user_id} stats={s} />
        ))}
      </div>

      {/* Pending commitments from previous meetings */}
      {(commitments ?? []).length > 0 && (
        <div>
          <h4
            className="mb-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Commitments to review ({commitments!.length})
          </h4>
          <CommitmentReview
            commitments={commitments!}
            meetingId={meetingId}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}
