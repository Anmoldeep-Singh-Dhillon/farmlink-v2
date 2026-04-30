import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QueryClient } from '@tanstack/react-query'

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),

      login: (token, user) => set({ token, user }),

      logout: () => {
        set({ token: null, user: null })
        // Clear all cached queries on logout
        window.queryClient?.clear()
      },
    }),
    {
      name: 'farmlink-auth',
    }
  )
)

export default useAuthStore