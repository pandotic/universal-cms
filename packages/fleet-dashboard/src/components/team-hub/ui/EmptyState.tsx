"use client";

import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon size={32} style={{ color: 'var(--text-tertiary)' }} className="mb-3" />}
      <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 rounded-md px-3 py-1.5 text-[13px] font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
