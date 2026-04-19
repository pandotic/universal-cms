"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import { useTeamUser } from './useTeamUser'
import type { OpenIssue, Issue } from '@/lib/team-hub/types'

export function useOpenIssues() {
  return useQuery({
    queryKey: ['open-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_issues')
        .select('*')
      if (error) throw error
      return data as OpenIssue[]
    },
  })
}

export function useAllIssues(filters?: {
  status?: string
  priority?: string
  submitter?: string
  source?: string
}) {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select(`
          *,
          submitter:users!submitter_id(name, short_name, color)
        `)
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      } else if (!filters?.status) {
        query = query.in('status', ['open', 'deferred'])
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.source && filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateIssue() {
  const queryClient = useQueryClient()
  const { teamUser } = useTeamUser()

  return useMutation({
    mutationFn: async (input: {
      title: string
      description?: string
      priority: 'urgent' | 'discuss' | 'fyi'
      source: Issue['source']
      raw_dump_text?: string
      ai_classified?: boolean
    }) => {
      if (!teamUser) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...input,
          submitter_id: teamUser.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['open-issues'] })
    },
  })
}

export function useResolveIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      issueId: string
      resolutionNote?: string
      meetingId?: string
      followUpTodo?: {
        description: string
        ownerName: string
        dueDate?: string
      }
    }) => {
      const { error } = await supabase
        .from('issues')
        .update({
          status: 'resolved',
          resolution_note: input.resolutionNote ?? null,
          resolved_at: new Date().toISOString(),
          resolved_in_meeting_id: input.meetingId ?? null,
        })
        .eq('id', input.issueId)

      if (error) throw error

      if (input.followUpTodo) {
        const { data: owner } = await supabase
          .from('users')
          .select('id')
          .eq('name', input.followUpTodo.ownerName)
          .single()

        const { error: todoError } = await supabase
          .from('todos')
          .insert({
            description: input.followUpTodo.description,
            owner_id: owner?.id ?? null,
            due_date: input.followUpTodo.dueDate ?? null,
            source: 'issue_resolution',
            related_issue_id: input.issueId,
            created_in_meeting_id: input.meetingId ?? null,
          })

        if (todoError) throw todoError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['open-issues'] })
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['active-todos'] })
    },
  })
}

export function useDeferIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase
        .from('issues')
        .update({ status: 'deferred' })
        .eq('id', issueId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['open-issues'] })
    },
  })
}

export function useDropIssue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase
        .from('issues')
        .update({ status: 'dropped' })
        .eq('id', issueId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      queryClient.invalidateQueries({ queryKey: ['open-issues'] })
    },
  })
}
