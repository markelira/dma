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
          // Force token refresh to ensure fresh token and get custom claims
          const idToken = await fbUser.getIdToken(true)
          const tokenResult = await fbUser.getIdTokenResult(true)
          const customClaims = tokenResult.claims

          console.log('[AuthProvider] Custom claims:', customClaims)

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
                // IMPORTANT: Prioritize custom claims over Firestore for role
                // Custom claims are more authoritative (set by Cloud Functions)
                role: (customClaims.role as string) || firestoreData.role || 'STUDENT',
                profilePictureUrl: firestoreData.profilePictureUrl || fbUser.photoURL || undefined,
                companyId: (customClaims.companyId as string) || firestoreData.companyId,
                companyRole: (customClaims.companyRole as string) || firestoreData.companyRole,
                universityId: firestoreData.universityId,
              }
              setAuth(userData, idToken)
              console.log('✅ Auth set from Firestore + Custom Claims:', userData)
            } else {
              // No Firestore doc - use custom claims if available, otherwise default to STUDENT
              const userData: User = {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: fbUser.email || '',
                firstName: fbUser.displayName?.split(' ')[0] || '',
                lastName: fbUser.displayName?.split(' ')[1] || '',
                role: (customClaims.role as string) || 'STUDENT',
                profilePictureUrl: fbUser.photoURL || undefined,
                companyId: customClaims.companyId as string | undefined,
                companyRole: customClaims.companyRole as string | undefined,
              }
              setAuth(userData, idToken)
              console.log('✅ Auth set from Firebase Auth + Custom Claims (no Firestore doc):', userData)
            }
          } catch (firestoreError) {
            console.error('Failed to fetch user from Firestore:', firestoreError)
            // Still set basic auth from Firebase Auth with custom claims
            const userData: User = {
              id: fbUser.uid,
              uid: fbUser.uid,
              email: fbUser.email || '',
              firstName: fbUser.displayName?.split(' ')[0] || '',
              lastName: fbUser.displayName?.split(' ')[1] || '',
              role: (customClaims.role as string) || 'STUDENT',
              profilePictureUrl: fbUser.photoURL || undefined,
              companyId: customClaims.companyId as string | undefined,
              companyRole: customClaims.companyRole as string | undefined,
            }
            setAuth(userData, idToken)
            console.log('✅ Auth set from Firebase Auth fallback + Custom Claims:', userData)
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