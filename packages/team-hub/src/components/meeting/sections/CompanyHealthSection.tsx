import { useStandingItems, useUpdateStandingItem } from '@/hooks/useMeetings'
import type { StandingItemWithTemplate } from '@/lib/types'

interface CompanyHealthSectionProps {
  meetingId: string
  readOnly?: boolean
}

const STATUS_CYCLE: Array<'no_update' | 'update' | 'needs_discussion'> = [
  'no_update',
  'update',
  'needs_discussion',
]

const STATUS_LABELS = {
  no_update: 'No update',
  update: 'Update',
  needs_discussion: 'Needs discussion',
}

const STATUS_COLORS = {
  no_update: { bg: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' },
  update: { bg: 'var(--priority-discuss-bg)', color: 'var(--priority-discuss)' },
  needs_discussion: { bg: 'var(--priority-urgent-bg)', color: 'var(--priority-urgent)' },
}

export function CompanyHealthSection({ meetingId, readOnly }: CompanyHealthSectionProps) {
  const { data: items, isLoading } = useStandingItems(meetingId)
  const updateItem = useUpdateStandingItem()

  const cycleStatus = (item: StandingItemWithTemplate) => {
    if (readOnly) return
    const currentIndex = STATUS_CYCLE.indexOf(item.status)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]!
    updateItem.mutate({ id: item.id, status: nextStatus })
  }

  const handleNoteChange = (item: StandingItemWithTemplate, note: string) => {
    updateItem.mutate({ id: item.id, note })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
      </div>
    )
  }

  if (!items?.length) {
    return <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>No standing items configured.</p>
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-md px-3 py-2"
          style={{
            background: item.status === 'no_update' ? 'transparent' : undefined,
            opacity: item.status === 'no_update' ? 0.5 : 1,
          }}
        >
          <button
            onClick={() => cycleStatus(item)}
            disabled={readOnly}
            className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors duration-150"
            style={STATUS_COLORS[item.status]}
          >
            {STATUS_LABELS[item.status]}
          </button>
          <span className="flex-1 text-[13px]" style={{ color: 'var(--text-primary)' }}>
            {item.standing_item_templates.name}
          </span>
          {!readOnly && item.status !== 'no_update' && (
            <input
              value={item.note ?? ''}
              onChange={(e) => handleNoteChange(item, e.target.value)}
              placeholder="Note..."
              className="w-48 rounded border px-2 py-1 text-[12px] outline-none"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          )}
          {readOnly && item.note && (
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {item.note}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
