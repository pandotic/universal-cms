"use client";

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/team-hub/supabase'
import type { CommandCenterFlag } from '@/lib/team-hub/types'

export function useCommandCenterFlags() {
  return useQuery({
    queryKey: ['command-center-flags'],
    queryFn: async () => {
      // Get the most recent snapshot date first
      const { data: latest } = await supabase
        .from('command_center_flags')
        .select('snapshot_date')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      if (!latest) return []

      const { data, error } = await supabase
        .from('command_center_flags')
        .select('*')
        .eq('snapshot_date', latest.snapshot_date)
        .order('name')

      if (error) throw error
      return data as CommandCenterFlag[]
    },
  })
}
