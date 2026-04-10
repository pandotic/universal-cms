import { create } from 'zustand'

interface MeetingTimerStore {
  elapsed: number
  isRunning: boolean
  intervalId: ReturnType<typeof setInterval> | null
  startTicking: (sectionStartedAt: string) => void
  stopTicking: () => void
  tick: (sectionStartedAt: string) => void
}

export const useMeetingTimerStore = create<MeetingTimerStore>((set, get) => ({
  elapsed: 0,
  isRunning: false,
  intervalId: null,

  startTicking: (sectionStartedAt: string) => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)

    const id = setInterval(() => {
      get().tick(sectionStartedAt)
    }, 1000)

    set({ intervalId: id, isRunning: true })
    get().tick(sectionStartedAt)
  },

  stopTicking: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ intervalId: null, isRunning: false, elapsed: 0 })
  },

  tick: (sectionStartedAt: string) => {
    const start = new Date(sectionStartedAt).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - start) / 1000)
    set({ elapsed: Math.max(0, elapsed) })
  },
}))
