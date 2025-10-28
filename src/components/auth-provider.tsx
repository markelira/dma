'use client'

import { useEffect, ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore, User } from '@/stores/authStore'

interface Props {
  children: ReactNode
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const { setAuth, clearAuth, user, accessToken, setAuthReady } = useAuthStore()

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Force token refresh to ensure fresh token
          const idToken = await fbUser.getIdToken(true)
          
          // If we already have this token stored, skip refresh
          if (accessToken === idToken && user) {
            setAuthReady(true)
            return
          }
          
          // Get user data from Firestore directly
          try {
            const { doc, getDoc } = await import('firebase/firestore')
            const { db } = await import('@/lib/firebase')
            
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
            
            if (userDoc.exists()) {
              const firestoreData = userDoc.data()
              const userData: User = {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: firestoreData.email || fbUser.email || '',
                firstName: firestoreData.firstName || '',
                lastName: firestoreData.lastName || '',
                role: firestoreData.role || 'STUDENT',
                profilePictureUrl: firestoreData.profilePictureUrl || fbUser.photoURL || undefined,
                companyId: firestoreData.companyId,
                companyRole: firestoreData.companyRole,
                universityId: firestoreData.universityId,
              }
              setAuth(userData, idToken)
              console.log('✅ Auth set from Firestore:', userData)
            } else {
              // Create a basic user profile if none exists
              const userData: User = {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: fbUser.email || '',
                firstName: fbUser.displayName?.split(' ')[0] || '',
                lastName: fbUser.displayName?.split(' ')[1] || '',
                role: 'STUDENT',
                profilePictureUrl: fbUser.photoURL || undefined,
              }
              setAuth(userData, idToken)
              console.log('✅ Auth set from Firebase Auth (no Firestore doc):', userData)
            }
          } catch (firestoreError) {
            console.error('Failed to fetch user from Firestore:', firestoreError)
            // Still set basic auth from Firebase Auth
            const userData: User = {
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email || '',
              firstName: fbUser.displayName?.split(' ')[0] || '',
              lastName: fbUser.displayName?.split(' ')[1] || '',
              role: 'STUDENT',
              profilePictureUrl: fbUser.photoURL || undefined,
            }
            setAuth(userData, idToken)
          }
        } catch (err) {
          console.error('Failed refreshing auth:', err)
          clearAuth()
        }
      } else {
        clearAuth()
      }
      
      // Mark auth ready after processing
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [])

  return <>{children}</>
} 