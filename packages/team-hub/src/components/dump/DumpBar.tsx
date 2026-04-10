import { Plus, Command } from 'lucide-react'
import { useUIStore } from '@/stores/ui'

export function DumpBar() {
  const openDumpModal = useUIStore((s) => s.openDumpModal)

  return (
    <div className="mb-6">
      <button
        onClick={() => openDumpModal()}
        className="flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] transition-colors duration-150 cursor-text"
        style={{
          borderColor: 'var(--border-default)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-tertiary)',
        }}
      >
        <Plus size={16} />
        <span className="flex-1 text-left">Dump an issue, to-do, or note...</span>
        <kbd
          className="flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <Command size={10} />K
        </kbd>
      </button>

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => openDumpModal('issue')}
          className="rounded-md border px-3 py-1 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Issue
        </button>
        <button
          onClick={() => openDumpModal('todo')}
          className="rounded-md border px-3 py-1 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          To-do
        </button>
        <button
          onClick={() => openDumpModal('note')}
          className="rounded-md border px-3 py-1 text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          Just a note
        </button>
        <span className="self-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          AI will classify if not specified
        </span>
      </div>
    </div>
  )
}
