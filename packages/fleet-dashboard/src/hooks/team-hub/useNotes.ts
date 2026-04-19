"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import { useTeamUser } from './useTeamUser'
import type { NoteWithUser } from '@/lib/team-hub/types'

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
  const { teamUser } = useTeamUser()

  return useMutation({
    mutationFn: async (input: {
      text: string
      meetingId?: string
    }) => {
      if (!teamUser) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('notes')
        .insert({
          text: input.text,
          created_by: teamUser.id,
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
