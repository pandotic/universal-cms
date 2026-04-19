import { Moon, Sun, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { signOut } from '@/lib/auth'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

export function UserMenu() {
  const { teamUser, email } = useAuth()
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = teamUser?.name ?? email ?? 'Signed in'
  const short = teamUser?.short_name ?? (email?.[0]?.toUpperCase() ?? '?')
  const color = teamUser?.color ?? 'var(--text-tertiary)'

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
      >
        <UserAvatar name={short} color={color} />
        <span className="flex-1 text-left font-medium" style={{ color: 'var(--text-primary)' }}>
          {displayName}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-full rounded-lg border p-1 shadow-lg"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
        >
          {email && (
            <p
              className="px-2 py-1 text-[11px]"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              {email}
            </p>
          )}

          <button
            onClick={() => {
              toggleDarkMode()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            {isDarkMode ? 'Light mode' : 'Dark mode'}
          </button>

          <div className="my-1 border-t" style={{ borderColor: 'var(--border-default)' }} />

          <button
            onClick={() => {
              setOpen(false)
              handleSignOut()
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
