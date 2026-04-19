import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { IssueDiscussionWithUser } from '@/lib/types'

export function useIssueDiscussions(issueId: string) {
  return useQuery({
    queryKey: ['issue-discussions', issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_discussions')
        .select('*, users(*)')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as IssueDiscussionWithUser[]
    },
  })
}

export function useAddIssueDiscussion() {
  const queryClient = useQueryClient()
  const { teamUser } = useAuth()

  return useMutation({
    mutationFn: async (input: {
      issueId: string
      note: string
      meetingId?: string
      source?: 'manual' | 'transcript'
    }) => {
      if (!teamUser) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('issue_discussions')
        .insert({
          issue_id: input.issueId,
          note: input.note,
          meeting_id: input.meetingId ?? null,
          created_by: teamUser.id,
          source: input.source ?? 'manual',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-discussions', variables.issueId] })
    },
  })
}
