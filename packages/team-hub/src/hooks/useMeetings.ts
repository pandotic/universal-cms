import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, addDays } from 'date-fns'
import type { Meeting, StandingItemWithTemplate } from '@/lib/types'

function getCurrentMeetingDate() {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  return format(addDays(weekStart, 1), 'yyyy-MM-dd')
}

export function useCurrentMeeting() {
  const queryClient = useQueryClient()
  const meetingDate = getCurrentMeetingDate()

  return useQuery({
    queryKey: ['current-meeting'],
    queryFn: async () => {
      // Try to find existing meeting for this week
      const { data: existing } = await supabase
        .from('meetings')
        .select('*')
        .eq('meeting_date', meetingDate)
        .single()

      if (existing) return existing as Meeting

      // Create via RPC
      const { data: meetingId, error } = await supabase
        .rpc('create_next_meeting', { p_meeting_date: meetingDate })

      if (error) throw error

      // Fetch the newly created meeting
      const { data: meeting, error: fetchError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (fetchError) throw fetchError

      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      return meeting as Meeting
    },
  })
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Meeting
    },
  })
}

export function useArchivedMeetings() {
  return useQuery({
    queryKey: ['meetings', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'archived')
        .order('meeting_date', { ascending: false })
      if (error) throw error
      return data as Meeting[]
    },
  })
}

export function useStandingItems(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['standing-items', meetingId],
    enabled: !!meetingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standing_items')
        .select('*, standing_item_templates(*)')
        .eq('meeting_id', meetingId!)
        .order('standing_item_templates(sort_order)', { ascending: true })
      if (error) throw error
      return data as StandingItemWithTemplate[]
    },
  })
}

export function useUpdateStandingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      status?: 'no_update' | 'update' | 'needs_discussion'
      note?: string
    }) => {
      const { error } = await supabase
        .from('standing_items')
        .update({
          ...(input.status !== undefined && { status: input.status }),
          ...(input.note !== undefined && { note: input.note }),
        })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-items'] })
    },
  })
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      rating?: number
      attendees?: string[]
      status?: Meeting['status']
      started_at?: string
      notes?: string
    }) => {
      const update: Record<string, unknown> = {}
      if (input.rating !== undefined) update.rating = input.rating
      if (input.attendees !== undefined) update.attendees = input.attendees
      if (input.status !== undefined) update.status = input.status
      if (input.started_at !== undefined) update.started_at = input.started_at
      if (input.notes !== undefined) update.notes = input.notes
      if (input.status === 'archived') update.archived_at = new Date().toISOString()

      const { error } = await supabase
        .from('meetings')
        .update(update)
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-meeting'] })
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useArchiveMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ meetingId, rating }: { meetingId: string; rating?: number }) => {
      // Archive the current meeting
      const { error: archiveError } = await supabase
        .from('meetings')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          rating: rating ?? null,
        })
        .eq('id', meetingId)
      if (archiveError) throw archiveError

      // Create next week's meeting
      const nextDate = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const { error: rpcError } = await supabase
        .rpc('create_next_meeting', { p_meeting_date: nextDate })
      if (rpcError) throw rpcError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-meeting'] })
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
      if (error) throw error
      return data
    },
  })
}
