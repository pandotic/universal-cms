"use client";

import { useCommandCenterFlags } from '@/hooks/team-hub/useCommandCenterFlags'
import { ExternalLink } from 'lucide-react'
import { EmptyState } from '@/components/team-hub/ui/EmptyState'

const RYG_COLORS = {
  green: 'var(--status-green)',
  yellow: 'var(--status-yellow)',
  red: 'var(--status-red)',
  gray: 'var(--status-gray)',
}

export function CommandCenterReviewSection() {
  const { data: flags, isLoading } = useCommandCenterFlags()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md" style={{ background: 'var(--bg-tertiary)' }} />
        ))}
      </div>
    )
  }

  if (!flags?.length) {
    return (
      <EmptyState
        message="No items flagged from Command Center this week."
      />
    )
  }

  return (
    <div className="space-y-1.5">
      {flags.map((flag) => (
        <div
          key={flag.id}
          className="flex items-center gap-3 rounded-md px-3 py-2"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: flag.ryg_status ? RYG_COLORS[flag.ryg_status] : RYG_COLORS.gray }}
          />
          <span className="flex-1 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {flag.name}
          </span>
          {flag.reason && (
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {flag.reason}
            </span>
          )}
          {flag.external_url && (
            <a
              href={flag.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-tertiary)] hover:text-[var(--accent)]"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
