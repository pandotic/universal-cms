"use client";

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import type { MeetingStats } from '@/lib/team-hub/types'

export function useMeetingStats(limit: number = 12) {
  return useQuery({
    queryKey: ['meeting-stats', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_stats')
        .select('*')
        .limit(limit)
      if (error) throw error
      return data as MeetingStats[]
    },
  })
}
