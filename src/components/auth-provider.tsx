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
    console.log('🔧 [DIAGNOSTIC] AuthProvider useEffect mounting')
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('🔥 [DIAGNOSTIC] onAuthStateChanged fired', {
        hasUser: !!fbUser,
        uid: fbUser?.uid,
        email: fbUser?.email,
        timestamp: Date.now()
      })
      if (fbUser) {
        try {
          // Get token WITHOUT forcing refresh (only refresh when needed)
          const idToken = await fbUser.getIdToken(false)
          const tokenResult = await fbUser.getIdTokenResult(false)
          const customClaims = tokenResult.claims

          console.log('🔍 [RESEARCH] AuthProvider custom claims:', {
            role: customClaims.role,
            companyId: customClaims.companyId,
            companyRole: customClaims.companyRole,
            allClaims: Object.keys(customClaims)
          })

          // Get user data from Firestore directly
          try {
            const { doc, getDoc } = await import('firebase/firestore')
            const { db } = await import('@/lib/firebase')

            const userDoc = await getDoc(doc(db, 'users', fbUser.uid))

            if (userDoc.exists()) {
              const firestoreData = userDoc.data()

              console.log('🔍 [RESEARCH] AuthProvider Firestore data:', {
                role: firestoreData.role,
                companyId: firestoreData.companyId,
                companyRole: firestoreData.companyRole,
                allFields: Object.keys(firestoreData)
              });

              const userData: User = {
                id: fbUser.uid,
                uid: fbUser.uid,
                email: firestoreData.email || fbUser.email || '',
                firstName: firestoreData.firstName || '',
                lastName: firestoreData.lastName || '',
                // IMPORTANT: Prioritize Firestore for company roles (COMPANY_ADMIN, COMPANY_EMPLOYEE)
                // Company roles in Firestore are set by completeCompanyOnboarding after custom claims
                // For other roles, prioritize custom claims
                role: firestoreData.role === 'COMPANY_ADMIN' || firestoreData.role === 'COMPANY_EMPLOYEE'
                  ? firestoreData.role
                  : ((customClaims.role as string) || firestoreData.role || 'STUDENT'),
                profilePictureUrl: firestoreData.profilePictureUrl || fbUser.photoURL || undefined,
                companyId: (customClaims.companyId as string) || firestoreData.companyId,
                companyRole: (customClaims.companyRole as string) || firestoreData.companyRole,
                universityId: firestoreData.universityId,
              }

              console.log('🔍 [RESEARCH] AuthProvider constructed user:', {
                role: userData.role,
                companyId: userData.companyId,
                companyRole: userData.companyRole,
                hasCompanyId: !!userData.companyId
              });

              setAuth(userData, idToken)
              console.log('✅ [RESEARCH] Auth set in store')
            } else {
              // No Firestore doc - check for pending registration first
              try {
                console.log('🔍 [AuthProvider] No Firestore doc, checking for pending registration...')
                const { httpsCallable } = await import('firebase/functions')
                const { functions } = await import('@/lib/firebase')

                const getPendingRegistration = httpsCallable<void, { found: boolean; data?: any }>(
                  functions,
                  'getPendingRegistration'
                )
                const pendingResult = await getPendingRegistration()

                if (pendingResult.data.found && pendingResult.data.data) {
                  // Only redirect if not already on /register to avoid infinite loop
                  const isOnRegisterPage = typeof window !== 'undefined' && window.location.pathname === '/register'

                  if (!isOnRegisterPage) {
                    console.log('🔄 [AuthProvider] User has pending registration, redirecting to /register...')
                    // Set minimal auth for redirect
                    const userData: User = {
                      id: fbUser.uid,
                      uid: fbUser.uid,
                      email: fbUser.email || '',
                      firstName: fbUser.displayName?.split(' ')[0] || '',
                      lastName: fbUser.displayName?.split(' ')[1] || '',
                      role: 'STUDENT',
                    }
                    setAuth(userData, idToken)
                    setAuthReady(true)
                    // Redirect to register to complete registration
                    window.location.href = '/register'
                    return
                  } else {
                    console.log('🔄 [AuthProvider] User has pending registration, already on /register - no redirect needed')
                  }
                }
              } catch (pendingError) {
                console.error('🔍 [AuthProvider] Error checking pending registration:', pendingError)
              }

              // No pending registration - use custom claims if available, otherwise default to STUDENT
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
        console.log('🔥 [DIAGNOSTIC] onAuthStateChanged: No user, clearing auth')
        clearAuth()
      }

      // Mark auth ready after processing
      console.log('✅ [DIAGNOSTIC] AuthProvider setting authReady=TRUE', {
        hasUser: !!fbUser,
        uid: fbUser?.uid,
        timestamp: Date.now()
      })
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [])

  return <>{children}</>
} 