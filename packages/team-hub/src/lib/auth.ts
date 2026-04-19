import { supabase } from './supabase'

export async function signInWithMagicLink(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized.endsWith('@pandotic.com')) {
    throw new Error('Only @pandotic.com email addresses may sign in.')
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
