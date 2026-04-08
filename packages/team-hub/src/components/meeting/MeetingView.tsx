import { MeetingHeader } from './MeetingHeader'
import { AgendaSection } from './AgendaSection'
import { CompanyHealthSection } from './sections/CompanyHealthSection'
import { CommandCenterReviewSection } from './sections/CommandCenterReviewSection'
import { IssuesSection } from './sections/IssuesSection'
import { TodosSection } from './sections/TodosSection'
import { ClosingSection } from './sections/ClosingSection'
import { AGENDA_SECTIONS } from '@/lib/constants'
import type { Meeting } from '@/lib/types'

interface MeetingViewProps {
  meeting: Meeting
  readOnly?: boolean
}

export function MeetingView({ meeting, readOnly }: MeetingViewProps) {
  return (
    <div>
      <MeetingHeader meeting={meeting} readOnly={readOnly} />

      <AgendaSection
        number={AGENDA_SECTIONS[0].number}
        title={AGENDA_SECTIONS[0].title}
        timeBudget={AGENDA_SECTIONS[0].timeBudget}
      >
        <CompanyHealthSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[1].number}
        title={AGENDA_SECTIONS[1].title}
        timeBudget={AGENDA_SECTIONS[1].timeBudget}
      >
        <CommandCenterReviewSection />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[2].number}
        title={AGENDA_SECTIONS[2].title}
        timeBudget={AGENDA_SECTIONS[2].timeBudget}
      >
        <IssuesSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[3].number}
        title={AGENDA_SECTIONS[3].title}
        timeBudget={AGENDA_SECTIONS[3].timeBudget}
      >
        <TodosSection meetingId={meeting.id} readOnly={readOnly} />
      </AgendaSection>

      <AgendaSection
        number={AGENDA_SECTIONS[4].number}
        title={AGENDA_SECTIONS[4].title}
        timeBudget={AGENDA_SECTIONS[4].timeBudget}
      >
        <ClosingSection meeting={meeting} readOnly={readOnly} />
      </AgendaSection>
    </div>
  )
}
