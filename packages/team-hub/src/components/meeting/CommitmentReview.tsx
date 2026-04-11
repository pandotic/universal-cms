import { useUpdateCommitment } from '@/hooks/useAccountability'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { Check, X, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { CommitmentWithUser } from '@/lib/types'

interface CommitmentReviewProps {
  commitments: CommitmentWithUser[]
  meetingId: string
  readOnly?: boolean
}

export function CommitmentReview({ commitments, meetingId, readOnly }: CommitmentReviewProps) {
  const updateCommitment = useUpdateCommitment()

  const handleUpdate = (id: string, status: 'fulfilled' | 'broken' | 'carried') => {
    updateCommitment.mutate(
      { id, status, reviewedInMeetingId: meetingId },
      {
        onSuccess: () => {
          const labels = { fulfilled: 'Fulfilled', broken: 'Marked broken', carried: 'Carried forward' }
          toast.success(labels[status])
        },
      }
    )
  }

  return (
    <div className="space-y-2">
      {commitments.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border p-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-start gap-2">
            {c.users && (
              <UserAvatar name={c.users.short_name} color={c.users.color} size={20} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {c.description}
              </p>
              {c.source_quote && (
                <p className="mt-1 text-[12px] italic" style={{ color: 'var(--text-tertiary)' }}>
                  "{c.source_quote}"
                </p>
              )}
              {c.due_description && (
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Due: {c.due_description}
                </p>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="mt-2 flex gap-2 pl-7">
              <button
                onClick={() => handleUpdate(c.id, 'fulfilled')}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                style={{ borderColor: 'var(--border-default)', color: 'var(--status-green)' }}
              >
                <Check size={12} /> Done
              </button>
              <button
                onClick={() => handleUpdate(c.id, 'broken')}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                style={{ borderColor: 'var(--border-default)', color: 'var(--priority-urgent)' }}
              >
                <X size={12} /> Not done
              </button>
              <button
                onClick={() => handleUpdate(c.id, 'carried')}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <ArrowRight size={12} /> Carry
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
