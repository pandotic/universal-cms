import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WeeklyUserStats, CommitmentWithUser } from '@/lib/types'

export function useWeeklyUserStats() {
  return useQuery({
    queryKey: ['weekly-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_user_stats')
        .select('*')
      if (error) throw error
      return data as WeeklyUserStats[]
    },
  })
}

export function usePendingCommitments(meetingId?: string) {
  return useQuery({
    queryKey: ['commitments', 'pending', meetingId],
    queryFn: async () => {
      let query = supabase
        .from('commitments')
        .select('*, users(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // If we have a meeting ID, get commitments from the PREVIOUS meeting
      // (not the current one) for review
      if (meetingId) {
        query = query.neq('meeting_id', meetingId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as CommitmentWithUser[]
    },
  })
}

export function useUpdateCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      status: 'fulfilled' | 'broken' | 'carried'
      reviewedInMeetingId?: string
    }) => {
      const { error } = await supabase
        .from('commitments')
        .update({
          status: input.status,
          reviewed_in_meeting_id: input.reviewedInMeetingId ?? null,
        })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-user-stats'] })
    },
  })
}
