import { NavLink } from 'react-router-dom'
import { CalendarDays, CircleDot, CheckSquare, Archive, ExternalLink } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Weekly meeting', icon: CalendarDays },
  { to: '/issues', label: 'Issues list', icon: CircleDot },
  { to: '/todos', label: 'To-dos', icon: CheckSquare },
  { to: '/meetings', label: 'Past meetings', icon: Archive },
]

export function Sidebar() {
  return (
    <aside
      className="flex w-56 flex-col border-r"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-default)' }}
    >
      <div className="px-4 py-5">
        <h1 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
          Pandotic
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Team Hub
        </p>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
                isActive
                  ? 'text-[var(--accent)]'
                  : 'hover:bg-[var(--bg-tertiary)]'
              )
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-bg)' : undefined,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div className="pt-4 pb-2">
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Elsewhere
          </p>
        </div>

        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ExternalLink size={16} />
          Command Center
        </a>
      </nav>

      <div className="border-t p-3" style={{ borderColor: 'var(--border-default)' }}>
        <UserMenu />
      </div>
    </aside>
  )
}
