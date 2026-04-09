import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DumpClassification } from '@/lib/types'

export function useDumpClassify() {
  return useMutation({
    mutationFn: async (text: string): Promise<DumpClassification> => {
      const { data, error } = await supabase.functions.invoke('dump-classify', {
        body: { text },
      })

      if (error) throw error
      return data as DumpClassification
    },
  })
}
