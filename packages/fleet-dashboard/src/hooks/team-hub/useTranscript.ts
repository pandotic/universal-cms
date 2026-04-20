"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import type { MeetingTranscript } from '@/lib/team-hub/types'

export function useTranscript(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['transcript', meetingId],
    enabled: !!meetingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('meeting_id', meetingId!)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return (data as MeetingTranscript) ?? null
    },
  })
}

export function useProcessTranscript() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      meetingId: string
      transcriptText: string
      openIssues: Array<{ id: string; title: string }>
    }) => {
      // First, upsert the transcript record
      const { error: upsertError } = await supabase
        .from('meeting_transcripts')
        .upsert({
          meeting_id: input.meetingId,
          transcript_text: input.transcriptText,
        }, { onConflict: 'meeting_id' })

      if (upsertError) throw upsertError

      // Call the edge function to process with AI
      const { data, error } = await supabase.functions.invoke('process-transcript', {
        body: {
          meeting_id: input.meetingId,
          transcript_text: input.transcriptText,
          team_members: ['Allen', 'Matt', 'Dan', 'Scott'],
          open_issues: input.openIssues,
        },
      })

      if (error) throw error
      return data as MeetingTranscript
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transcript', variables.meetingId] })
    },
  })
}

export function useAcceptTranscriptItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      meetingId: string
      todos: Array<{ owner: string; description: string; due: string | null }>
      commitments: Array<{ owner: string; description: string; quote: string; due_description: string | null }>
      issueNotes: Array<{ issueId: string; note: string }>
    }) => {
      // Create todos
      for (const todo of input.todos) {
        const { data: owner } = await supabase
          .from('users')
          .select('id')
          .eq('name', todo.owner)
          .single()

        await supabase.from('todos').insert({
          description: todo.description,
          owner_id: owner?.id ?? null,
          due_date: todo.due,
          source: 'meeting',
          created_in_meeting_id: input.meetingId,
        })
      }

      // Create commitments
      for (const commitment of input.commitments) {
        const { data: owner } = await supabase
          .from('users')
          .select('id')
          .eq('name', commitment.owner)
          .single()

        await supabase.from('commitments').insert({
          meeting_id: input.meetingId,
          owner_id: owner?.id ?? null,
          description: commitment.description,
          source_quote: commitment.quote,
          due_description: commitment.due_description,
        })
      }

      // Create issue discussion notes from transcript
      for (const note of input.issueNotes) {
        await supabase.from('issue_discussions').insert({
          issue_id: note.issueId,
          meeting_id: input.meetingId,
          note: note.note,
          source: 'transcript',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['active-todos'] })
      queryClient.invalidateQueries({ queryKey: ['commitments'] })
      queryClient.invalidateQueries({ queryKey: ['issue-discussions'] })
    },
  })
}
