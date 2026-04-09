import { Moon, Sun, ChevronDown } from 'lucide-react'
import { useCurrentUserStore } from '@/stores/currentUser'
import { useUIStore } from '@/stores/ui'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { TEAM_MEMBERS } from '@/lib/constants'
import { useState, useRef, useEffect } from 'react'

export function UserMenu() {
  const { currentUser, setCurrentUser } = useCurrentUserStore()
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
      >
        <UserAvatar name={currentUser.shortName} color={currentUser.color} />
        <span className="flex-1 text-left font-medium" style={{ color: 'var(--text-primary)' }}>
          {currentUser.name}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-full rounded-lg border p-1 shadow-lg"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
        >
          <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Switch user
          </p>
          {TEAM_MEMBERS.map((member) => (
            <button
              key={member.name}
              onClick={() => {
                setCurrentUser(member)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <UserAvatar name={member.shortName} color={member.color} size={20} />
              {member.name}
            </button>
          ))}

          <div className="my-1 border-t" style={{ borderColor: 'var(--border-default)' }} />

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
        </div>
      )}
    </div>
  )
}
