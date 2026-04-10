import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUserStore } from '@/stores/currentUser'
import type { NoteWithUser } from '@/lib/types'

export function useNotes(meetingId?: string) {
  return useQuery({
    queryKey: ['notes', meetingId],
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*, users(*)')
        .eq('archived', false)
        .order('created_at', { ascending: false })

      if (meetingId) {
        query = query.eq('meeting_id', meetingId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as NoteWithUser[]
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUserStore((s) => s.currentUser)

  return useMutation({
    mutationFn: async (input: {
      text: string
      meetingId?: string
    }) => {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('name', currentUser.name)
        .single()

      const { data, error } = await supabase
        .from('notes')
        .insert({
          text: input.text,
          created_by: user?.id ?? null,
          meeting_id: input.meetingId ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
