import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DumpBar } from '../dump/DumpBar'
import { DumpModal } from '../dump/DumpModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUIStore } from '@/stores/ui'

export function AppShell() {
  useKeyboardShortcuts()
  const isDarkMode = useUIStore((s) => s.isDarkMode)

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-6 py-4">
            <DumpBar />
            <Outlet />
          </div>
        </main>
        <DumpModal />
      </div>
    </div>
  )
}
