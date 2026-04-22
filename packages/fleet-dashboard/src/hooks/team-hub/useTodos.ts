"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import { useTeamUser } from './useTeamUser'
import type { ActiveTodo, Todo } from '@/lib/team-hub/types'

export function useActiveTodos() {
  return useQuery({
    queryKey: ['active-todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_todos')
        .select('*')
      if (error) throw error
      return data as ActiveTodo[]
    },
  })
}

export function useAllTodos(filters?: {
  owner?: string
  status?: string
  source?: string
}) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: async () => {
      let query = supabase
        .from('todos')
        .select(`
          *,
          owner:users!owner_id(name, short_name, color)
        `)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      } else if (!filters?.status) {
        query = query.eq('status', 'open')
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

export function useCreateTodo() {
  const queryClient = useQueryClient()
  const { teamUser } = useTeamUser()

  return useMutation({
    mutationFn: async (input: {
      description: string
      ownerName?: string
      due_date?: string
      source: Todo['source']
      raw_dump_text?: string
      ai_classified?: boolean
      related_issue_id?: string
      created_in_meeting_id?: string
    }) => {
      if (!teamUser) throw new Error('Not signed in')

      let ownerId: string = teamUser.id
      if (input.ownerName && input.ownerName !== teamUser.name) {
        const { data: owner } = await supabase
          .from('users')
          .select('id')
          .eq('name', input.ownerName)
          .single()
        if (owner?.id) ownerId = owner.id
      }

      const { data, error } = await supabase
        .from('todos')
        .insert({
          description: input.description,
          owner_id: ownerId,
          due_date: input.due_date ?? null,
          source: input.source,
          raw_dump_text: input.raw_dump_text ?? null,
          ai_classified: input.ai_classified ?? false,
          related_issue_id: input.related_issue_id ?? null,
          created_in_meeting_id: input.created_in_meeting_id ?? null,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          const dup = new Error('This to-do is already on the open list') as Error & { code: string }
          dup.code = 'duplicate_open'
          throw dup
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['active-todos'] })
    },
  })
}

export function useToggleTodoDone() {
  const queryClient = useQueryClient()
  const { teamUser } = useTeamUser()

  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('todos')
        .update({
          status: done ? 'done' : 'open',
          completed_at: done ? new Date().toISOString() : null,
          completed_by: done ? (teamUser?.id ?? null) : null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['active-todos'] })
    },
  })
}

export function useCarryForwardTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, newDueDate }: { id: string; newDueDate: string }) => {
      // Increment carry_count and update due date
      const { data: todo } = await supabase
        .from('todos')
        .select('carry_count')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('todos')
        .update({
          due_date: newDueDate,
          carry_count: (todo?.carry_count ?? 0) + 1,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['active-todos'] })
    },
  })
}

export function useCancelTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .update({ status: 'cancelled' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['active-todos'] })
    },
  })
}
