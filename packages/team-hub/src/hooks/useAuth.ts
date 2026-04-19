import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/types'

type AuthStatus = 'loading' | 'unauthed' | 'authed'

function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

export function useAuth(): {
  status: AuthStatus
  teamUser: User | null
  authUserId: string | null
  email: string | null
} {
  const { session, loading } = useSession()
  const authUserId = session?.user?.id ?? null

  const { data: teamUser, isLoading: teamUserLoading } = useQuery({
    queryKey: ['team-user', authUserId],
    enabled: !!authUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()
      if (error) throw error
      return data as User
    },
  })

  let status: AuthStatus = 'loading'
  if (loading) status = 'loading'
  else if (!authUserId) status = 'unauthed'
  else if (teamUserLoading) status = 'loading'
  else status = 'authed'

  return {
    status,
    teamUser: teamUser ?? null,
    authUserId,
    email: session?.user?.email ?? null,
  }
}
