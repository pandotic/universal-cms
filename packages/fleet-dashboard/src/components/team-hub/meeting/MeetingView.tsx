"use client";

import { MeetingHeader } from './MeetingHeader'
import { AgendaSection } from './AgendaSection'
import { CompanyHealthSection } from './sections/CompanyHealthSection'
import { FleetReviewSection } from './sections/FleetReviewSection'
import { AccountabilitySection } from './sections/AccountabilitySection'
import { IssuesSection } from './sections/IssuesSection'
import { TodosSection } from './sections/TodosSection'
import { NotesSection } from './sections/NotesSection'
import { ClosingSection } from './sections/ClosingSection'
import { useRealtimeSubscription } from '@/hooks/team-hub/useRealtimeSubscription'
import { AGENDA_SECTIONS } from '@/lib/team-hub/constants'
import type { Meeting } from '@/lib/team-hub/types'

interface MeetingViewProps {
  meeting: Meeting
  readOnly?: boolean
}

const REALTIME_KEYS = {
  issues: [['issues'], ['open-issues']],
  todos: [['todos'], ['active-todos']],
  meetings: [['current-meeting'], ['meetings']],
  standing_items: [['standing-items']],
  notes: [['notes']],
  commitments: [['commitments'], ['weekly-user-stats']],
}

export function MeetingView({ meeting, readOnly }: MeetingViewProps) {
  const isLive = meeting.status === 'in_progress'

  // Realtime subscriptions — only active during in-progress meetings
  useRealtimeSubscription('issues', REALTIME_KEYS.issues, isLive)
  useRealtimeSubscription('todos', REALTIME_KEYS.todos, isLive)
  useRealtimeSubscription('meetings', REALTIME_KEYS.meetings, isLive)
  useRealtimeSubscription('standing_items', REALTIME_KEYS.standing_items, isLive)
  useRealtimeSubscription('notes', REALTIME_KEYS.notes, isLive)
  useRealtimeSubscription('commitments', REALTIME_KEYS.commitments, isLive)

  return (
    <div>
      <MeetingHeader meeting={meeting} readOnly={readOnly} />

      <AgendaSection
        number={AGENDA_SECTIONS[0].number}
        title={AGENDA_SECTIONS[0].title}
        timeBudget={AGENDA_SECTIONS[0].timeBudget}
        sectionIndex={0}
        meeting={meeting}
      >
        <CompanyHealthSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[1].number}
        title={AGENDA_SECTIONS[1].title}
        timeBudget={AGENDA_SECTIONS[1].timeBudget}
        sectionIndex={1}
        meeting={meeting}
      >
        <FleetReviewSection />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[2].number}
        title={AGENDA_SECTIONS[2].title}
        timeBudget={AGENDA_SECTIONS[2].timeBudget}
        sectionIndex={2}
        meeting={meeting}
      >
        <AccountabilitySection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[3].number}
        title={AGENDA_SECTIONS[3].title}
        timeBudget={AGENDA_SECTIONS[3].timeBudget}
        sectionIndex={3}
        meeting={meeting}
      >
        <IssuesSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[4].number}
        title={AGENDA_SECTIONS[4].title}
        timeBudget={AGENDA_SECTIONS[4].timeBudget}
        sectionIndex={4}
        meeting={meeting}
      >
        <TodosSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[5].number}
        title={AGENDA_SECTIONS[5].title}
        timeBudget={AGENDA_SECTIONS[5].timeBudget}
        sectionIndex={5}
        meeting={meeting}
      >
        <NotesSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[6].number}
        title={AGENDA_SECTIONS[6].title}
        timeBudget={AGENDA_SECTIONS[6].timeBudget}
        sectionIndex={6}
        meeting={meeting}
      >
        <ClosingSection meeting={meeting} readOnly={readOnly} />
      </AgendaSection>
    </div>
  )
}
