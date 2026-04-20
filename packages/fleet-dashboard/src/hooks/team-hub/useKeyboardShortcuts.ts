"use client";

import { useEffect } from 'react'
import { useUIStore } from '@/stores/team-hub/ui'

export function useKeyboardShortcuts() {
  const { isDumpModalOpen, openDumpModal, closeDumpModal } = useUIStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isDumpModalOpen) {
          closeDumpModal()
        } else {
          openDumpModal()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDumpModalOpen, openDumpModal, closeDumpModal])
}
