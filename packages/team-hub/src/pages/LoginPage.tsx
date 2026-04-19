import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithMagicLink } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { status } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'authed') {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await signInWithMagicLink(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-6 shadow-sm"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-default)' }}
      >
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pandotic Team Hub
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          Sign in with your @pandotic.com email.
        </p>

        {sent ? (
          <div
            className="mt-5 rounded-md border px-3 py-2 text-[13px]"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            Check <span style={{ color: 'var(--text-primary)' }}>{email}</span> for a sign-in
            link. You can close this tab; the link opens the app in a new session.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block">
              <span
                className="mb-1 block text-[12px] font-medium"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Email
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pandotic.com"
                className="w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:border-[var(--accent)]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </label>

            {error && (
              <p
                className="text-[12px]"
                style={{ color: 'var(--priority-urgent)' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-md px-4 py-2 text-[14px] font-medium text-white transition-colors duration-150 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {sending ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
