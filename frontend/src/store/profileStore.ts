import { create } from 'zustand'

export interface UserProfile {
  user_id: string
  personal: {
    name: string
    dob?: string
    gender?: string
    height_cm?: number
    weight_kg?: number
    blood_type?: string
    city?: string
    state?: string
    language_pref: 'en' | 'hi' | 'ta'
  }
  medical_history: {
    conditions: string[]
    medications: string[]
    allergies: string[]
    surgeries: string[]
  }
  diet: {
    type?: string
    restrictions: string[]
    cuisine_region?: string
  }
  bmi?: number
  age?: number
}

interface ProfileState {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  setProfile: (profile: UserProfile) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>()((set) => ({
  profile: null,
  loading: false,
  error: null,
  setProfile: (profile) => set({ profile, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  clearProfile: () => set({ profile: null }),
}))
