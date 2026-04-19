"use client";

import { cn } from '@/lib/team-hub/utils'

interface PriorityBadgeProps {
  priority: 'urgent' | 'discuss' | 'fyi'
  className?: string
}

const styles = {
  urgent: {
    background: 'var(--priority-urgent-bg)',
    color: 'var(--priority-urgent)',
  },
  discuss: {
    background: 'var(--priority-discuss-bg)',
    color: 'var(--priority-discuss)',
  },
  fyi: {
    background: 'var(--priority-fyi-bg)',
    color: 'var(--priority-fyi)',
  },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        className
      )}
      style={styles[priority]}
    >
      {priority}
    </span>
  )
}
