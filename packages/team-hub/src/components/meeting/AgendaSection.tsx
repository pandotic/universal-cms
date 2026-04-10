import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { SectionTimer } from './SectionTimer'
import { AGENDA_SECTIONS } from '@/lib/constants'
import type { Meeting } from '@/lib/types'

interface AgendaSectionProps {
  number: string
  title: string
  timeBudget: string
  children: React.ReactNode
  defaultOpen?: boolean
  sectionIndex?: number
  meeting?: Meeting
}

export function AgendaSection({ number, title, timeBudget, children, defaultOpen = true, sectionIndex, meeting }: AgendaSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const isActiveSection = meeting && sectionIndex !== undefined && meeting.current_section === sectionIndex && meeting.status === 'in_progress'
  const sectionConfig = sectionIndex !== undefined ? AGENDA_SECTIONS[sectionIndex] : undefined

  return (
    <div
      className="border-b pb-4 mb-4"
      style={{
        borderColor: isActiveSection ? 'var(--accent)' : 'var(--border-default)',
        borderLeftWidth: isActiveSection ? 2 : 0,
        paddingLeft: isActiveSection ? 8 : 0,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 py-2 text-left"
      >
        {isOpen ? (
          <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
        )}
        <span
          className="text-[12px] font-bold"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
        >
          {number}
        </span>
        <span className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        {isActiveSection && sectionConfig && meeting?.section_started_at ? (
          <SectionTimer
            budgetSeconds={sectionConfig.seconds}
            sectionStartedAt={meeting.section_started_at}
            isPaused={meeting.timer_paused}
            isActiveSection
          />
        ) : (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {timeBudget}
          </span>
        )}
      </button>
      {isOpen && <div className="pl-9 pt-2">{children}</div>}
    </div>
  )
}
