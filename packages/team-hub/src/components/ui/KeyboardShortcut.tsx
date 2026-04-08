interface KeyboardShortcutProps {
  keys: string
}

export function KeyboardShortcut({ keys }: KeyboardShortcutProps) {
  return (
    <kbd
      className="inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px]"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {keys}
    </kbd>
  )
}
