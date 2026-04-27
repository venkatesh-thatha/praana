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
        localStorage.removeItem('praana_token')
        set({ token: null, userId: null })
      },
    }),
    { name: 'praana-auth' }
  )
)
