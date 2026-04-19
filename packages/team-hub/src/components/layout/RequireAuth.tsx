import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-[13px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Loading…
      </div>
    )
  }

  if (status === 'unauthed') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
