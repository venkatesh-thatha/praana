import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  userId: string | null
  setAuth: (token: string, userId: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      setAuth: (token, userId) => {
        localStorage.setItem('praana_token', token)
        set({ token, userId })
      },
      logout: () => {
        // Clear both the manual key (read by client.ts interceptor)
        // and the Zustand persist entry (prevents stale token rehydration on next load)
        localStorage.removeItem('praana_token')
        localStorage.removeItem('praana-auth')
        set({ token: null, userId: null })
      },
    }),
    { name: 'praana-auth' }
  )
)
