'use client'

import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const router = useRouter()

  return async () => {
    try {
      await signOut(auth)
    } catch (_) {}
    clearAuth()
    toast.success('Sikeres kijelentkezés!')
    router.push('/')
  }
} 