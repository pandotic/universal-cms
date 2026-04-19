"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import type { MeetingIssueOrder } from '@/lib/team-hub/types'

export function useIssueOrder(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['issue-order', meetingId],
    enabled: !!meetingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_issue_order')
        .select('*')
        .eq('meeting_id', meetingId!)
        .order('sort_position', { ascending: true })
      if (error) throw error
      return data as MeetingIssueOrder[]
    },
  })
}

export function useReorderIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      meetingId: string
      issueId: string
      newPosition: number
    }) => {
      const { error } = await supabase
        .from('meeting_issue_order')
        .upsert({
          meeting_id: input.meetingId,
          issue_id: input.issueId,
          sort_position: input.newPosition,
        }, { onConflict: 'meeting_id,issue_id' })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-order', variables.meetingId] })
    },
  })
}

export function useInitializeIssueOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      meetingId: string
      issueIds: string[]
    }) => {
      // Check if order already exists
      const { data: existing } = await supabase
        .from('meeting_issue_order')
        .select('id')
        .eq('meeting_id', input.meetingId)
        .limit(1)

      if (existing && existing.length > 0) return // Already initialized

      const rows = input.issueIds.map((issueId, i) => ({
        meeting_id: input.meetingId,
        issue_id: issueId,
        sort_position: i,
      }))

      const { error } = await supabase
        .from('meeting_issue_order')
        .insert(rows)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issue-order', variables.meetingId] })
    },
  })
}
