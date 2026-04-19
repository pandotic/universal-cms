"use client";

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'

/**
 * Subscribes to Supabase Realtime changes on a table and invalidates
 * the specified query keys when changes occur.
 * Only active when `enabled` is true (e.g., during a meeting).
 */
export function useRealtimeSubscription(
  table: string,
  queryKeys: string[][],
  enabled: boolean = true
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, enabled, queryClient, queryKeys])
}
