import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUserStore } from '@/stores/currentUser'
import type { MeetingPrep, MeetingPrepWithUser } from '@/lib/types'

export function useMeetingPrepVotes(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-prep', meetingId],
    enabled: !!meetingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_prep')
        .select('*, users(name, short_name, color)')
        .eq('meeting_id', meetingId!)
        .order('priority_vote', { ascending: false })
      if (error) throw error
      return data as MeetingPrepWithUser[]
    },
  })
}

export function useMyPrepVotes(meetingId: string | undefined) {
  const currentUser = useCurrentUserStore((s) => s.currentUser)

  return useQuery({
    queryKey: ['meeting-prep', meetingId, 'my', currentUser.name],
    enabled: !!meetingId,
    queryFn: async () => {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('name', currentUser.name)
        .single()
      if (!user) return []

      const { data, error } = await supabase
        .from('meeting_prep')
        .select('*')
        .eq('meeting_id', meetingId!)
        .eq('user_id', user.id)
      if (error) throw error
      return data as MeetingPrep[]
    },
  })
}

export function useVoteOnIssue() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUserStore((s) => s.currentUser)

  return useMutation({
    mutationFn: async (input: {
      meetingId: string
      issueId: string
      priorityVote: number
      note?: string
    }) => {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('name', currentUser.name)
        .single()
      if (!user) throw new Error('User not found')

      const { error } = await supabase
        .from('meeting_prep')
        .upsert({
          meeting_id: input.meetingId,
          user_id: user.id,
          issue_id: input.issueId,
          priority_vote: input.priorityVote,
          note: input.note ?? null,
        }, { onConflict: 'meeting_id,user_id,issue_id' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-prep'] })
    },
  })
}

export function useMarkPrepReady() {
  const queryClient = useQueryClient()
  const currentUser = useCurrentUserStore((s) => s.currentUser)

  return useMutation({
    mutationFn: async (input: { meetingId: string; meeting: { prep_ready: string[] } }) => {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('name', currentUser.name)
        .single()
      if (!user) throw new Error('User not found')

      const current = input.meeting.prep_ready ?? []
      if (current.includes(user.id)) return

      const { error } = await supabase
        .from('meetings')
        .update({ prep_ready: [...current, user.id] })
        .eq('id', input.meetingId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-meeting'] })
    },
  })
}
