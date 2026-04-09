import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUserStore } from '@/stores/currentUser'
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
  const currentUser = useCurrentUserStore((s) => s.currentUser)

  return useMutation({
    mutationFn: async (input: {
      issueId: string
      note: string
      meetingId?: string
      source?: 'manual' | 'transcript'
    }) => {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('name', currentUser.name)
        .single()

      const { data, error } = await supabase
        .from('issue_discussions')
        .insert({
          issue_id: input.issueId,
          note: input.note,
          meeting_id: input.meetingId ?? null,
          created_by: user?.id ?? null,
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
