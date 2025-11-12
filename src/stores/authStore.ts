import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface User {
  id: string
  uid: string // Firebase UID
  firstName: string
  lastName: string
  email: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_EMPLOYEE' | 'UNIVERSITY_ADMIN'
  profilePictureUrl?: string
  subscriptionActive?: boolean
  companyId?: string
  companyRole?: string
  universityId?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  authReady: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  logout: () => Promise<void>
  updateSubscriptionStatus: (subscriptionActive: boolean) => void
  setAuthReady: (ready: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      authReady: false,
      error: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setToken: (token) => set({ accessToken: token }),
      setAuth: (user, token) => set({ 
        user, 
        accessToken: token, 
        isAuthenticated: true, 
        isLoading: false 
      }),
      clearAuth: () => set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false, 
        isLoading: false 
      }),
      updateSubscriptionStatus: (subscriptionActive) => set((state) => ({
        user: state.user ? { ...state.user, subscriptionActive } : null
      })),
      logout: async () => {
        try {
          await signOut(auth)
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            error: null
          })
        } catch (error) {
          console.error('Logout error:', error)
          throw error
        }
      },
      setAuthReady: (ready) => set({ authReady: ready })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [DIAGNOSTIC] Zustand rehydration START', {
          hasUser: !!state?.user,
          userId: state?.user?.id,
          userEmail: state?.user?.email,
          authReady: state?.authReady,
          timestamp: Date.now()
        })
        if (state) {
          state.isLoading = false
          state.authReady = true  // Set authReady after rehydration completes
          console.log('🔄 [DIAGNOSTIC] Zustand rehydration COMPLETE - authReady set to TRUE', {
            hasUser: !!state.user,
            userId: state.user?.id,
            authReady: state.authReady,
            timestamp: Date.now()
          })
        }
      },
    }
  )
) 