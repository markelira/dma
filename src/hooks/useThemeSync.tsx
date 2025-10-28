'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from 'next-themes'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useThemeSync() {
  const { user } = useAuthStore()
  const { setTheme } = useTheme()

  useEffect(() => {
    const loadUserTheme = async () => {
      if (!user?.uid) return

      try {
        const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid))
        if (settingsDoc.exists()) {
          const data = settingsDoc.data()
          const savedTheme = data.theme || 'light'
          setTheme(savedTheme)
        }
      } catch (error) {
        console.error('Error loading user theme:', error)
      }
    }

    loadUserTheme()
  }, [user, setTheme])
}