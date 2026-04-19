"use client";

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type DumpPresetType = 'issue' | 'todo' | 'note' | null

interface UIStore {
  isDumpModalOpen: boolean
  dumpModalPresetType: DumpPresetType
  openDumpModal: (type?: DumpPresetType) => void
  closeDumpModal: () => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDumpModalOpen: false,
      dumpModalPresetType: null,
      openDumpModal: (type = null) => set({ isDumpModalOpen: true, dumpModalPresetType: type }),
      closeDumpModal: () => set({ isDumpModalOpen: false, dumpModalPresetType: null }),
      isDarkMode: false,
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
    }),
    {
      name: 'team-hub-ui',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
)
