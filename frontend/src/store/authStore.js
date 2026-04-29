import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),

      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'farmlink-auth',
    }
  )
)

export default useAuthStore