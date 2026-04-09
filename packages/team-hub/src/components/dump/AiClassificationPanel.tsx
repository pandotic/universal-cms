import { Sparkles } from 'lucide-react'
import type { DumpClassification } from '@/lib/types'

interface AiClassificationPanelProps {
  classification: DumpClassification
  onAccept: () => void
  onChange: () => void
}

export function AiClassificationPanel({ classification, onAccept, onChange }: AiClassificationPanelProps) {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)' }}
    >
      <div className="flex items-center gap-2 text-[13px]">
        <Sparkles size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          AI thinks this is{' '}
          {classification.type === 'issue' ? 'an' : 'a'}{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {classification.type === 'issue' ? 'Issue' : 'To-do'}
          </strong>
          {classification.type === 'issue' && (
            <>
              {' · '}
              <span className="capitalize">{classification.priority}</span> priority
            </>
          )}
        </span>
      </div>
      {classification.suggested_title && (
        <p className="mt-1 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          Suggested: "{classification.suggested_title}"
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-md px-3 py-1 text-[12px] font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Looks right
        </button>
        <button
          onClick={onChange}
          className="rounded-md border px-3 py-1 text-[12px] font-medium"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Change
        </button>
      </div>
    </div>
  )
}
