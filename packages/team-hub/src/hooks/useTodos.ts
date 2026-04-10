import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUserStore } from '@/stores/currentUser'
import type { ActiveTodo, Todo } from '@/lib/types'

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
  const currentUser = useCurrentUserStore((s) => s.currentUser)

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
      const ownerName = input.ownerName ?? currentUser.name
      const { data: owner } = await supabase
        .from('users')
        .select('id')
        .eq('name', ownerName)
        .single()

      const { data, error } = await supabase
        .from('todos')
        .insert({
          description: input.description,
          owner_id: owner?.id ?? null,
          due_date: input.due_date ?? null,
          source: input.source,
          raw_dump_text: input.raw_dump_text ?? null,
          ai_classified: input.ai_classified ?? false,
          related_issue_id: input.related_issue_id ?? null,
          created_in_meeting_id: input.created_in_meeting_id ?? null,
        })
        .select()
        .single()

      if (error) throw error
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

  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('todos')
        .update({
          status: done ? 'done' : 'open',
          completed_at: done ? new Date().toISOString() : null,
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
      const { error } = await supabase
        .from('todos')
        .update({ due_date: newDueDate })
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
