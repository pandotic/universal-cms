"use client";

import { useEffect } from 'react'
import { useMeetingTimerStore } from '@/stores/team-hub/meetingTimer'
import { cn } from '@/lib/team-hub/utils'

interface SectionTimerProps {
  budgetSeconds: number
  sectionStartedAt: string | null
  isPaused: boolean
  isActiveSection: boolean
}

export function SectionTimer({ budgetSeconds, sectionStartedAt, isPaused, isActiveSection }: SectionTimerProps) {
  const { elapsed, startTicking, stopTicking } = useMeetingTimerStore()

  useEffect(() => {
    if (isActiveSection && sectionStartedAt && !isPaused) {
      startTicking(sectionStartedAt)
    } else {
      stopTicking()
    }
    return () => stopTicking()
  }, [isActiveSection, sectionStartedAt, isPaused, startTicking, stopTicking])

  if (!isActiveSection || !sectionStartedAt) return null

  const remaining = budgetSeconds - elapsed
  const isWarning = remaining <= 60 && remaining > 0
  const isOvertime = remaining <= 0

  const absRemaining = Math.abs(remaining)
  const minutes = Math.floor(absRemaining / 60)
  const seconds = absRemaining % 60
  const display = `${isOvertime ? '+' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 text-[12px] font-bold tabular-nums transition-colors duration-150',
        isOvertime && 'animate-pulse'
      )}
      style={{
        fontFamily: 'var(--font-mono)',
        background: isOvertime
          ? 'var(--priority-urgent-bg)'
          : isWarning
            ? 'var(--priority-discuss-bg)'
            : 'var(--bg-tertiary)',
        color: isOvertime
          ? 'var(--priority-urgent)'
          : isWarning
            ? 'var(--priority-discuss)'
            : 'var(--text-secondary)',
      }}
    >
      {isPaused ? '⏸ ' : ''}{display}
    </span>
  )
}
