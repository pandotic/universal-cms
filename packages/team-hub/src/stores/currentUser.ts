import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TEAM_MEMBERS } from '@/lib/constants'

interface TeamMember {
  name: string
  email: string
  shortName: string
  color: string
}

interface CurrentUserStore {
  currentUser: TeamMember
  setCurrentUser: (user: TeamMember) => void
}

export const useCurrentUserStore = create<CurrentUserStore>()(
  persist(
    (set) => ({
      currentUser: TEAM_MEMBERS[0],
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    { name: 'team-hub-current-user' }
  )
)
