import { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore, User } from '@/stores/authStore'

/**
 * Updates the Zustand auth store with fresh user data from Firebase Auth + Firestore
 * Replicates the logic from AuthProvider.tsx for manual auth state updates
 *
 * Use this when you need to manually update the auth store after operations that
 * change custom claims (like registration, role changes, etc.)
 *
 * @param fbUser - The Firebase User object
 */
export async function updateAuthStoreFromFirebase(fbUser: FirebaseUser): Promise<void> {
  try {
    // Step 1: Get Firebase ID token with custom claims (force refresh)
    const idToken = await fbUser.getIdToken(true)
    const tokenResult = await fbUser.getIdTokenResult(true)
    const customClaims = tokenResult.claims

    console.log('🔄 [updateAuthStore] Got custom claims:', {
      role: customClaims.role,
      companyId: customClaims.companyId,
      companyRole: customClaims.companyRole
    })

    // Step 2: Fetch user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid))

    if (!userDoc.exists()) {
      console.warn('⚠️ [updateAuthStore] User document not found in Firestore, using custom claims + Firebase Auth')

      // Fallback: Use custom claims + Firebase Auth data
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

      useAuthStore.getState().setAuth(userData, idToken)
      console.log('✅ [updateAuthStore] Store updated (fallback mode):', {
        role: userData.role,
        companyId: userData.companyId,
        companyRole: userData.companyRole
      })
      return
    }

    // Step 3: Merge Firestore data with custom claims
    const firestoreData = userDoc.data()

    const userData: User = {
      id: fbUser.uid,
      uid: fbUser.uid,
      email: firestoreData.email || fbUser.email || '',
      firstName: firestoreData.firstName || '',
      lastName: firestoreData.lastName || '',

      // Priority logic for role:
      // - If Firestore has COMPANY_ADMIN/COMPANY_EMPLOYEE, use that
      // - Otherwise use custom claim, then Firestore, then default
      role: firestoreData.role === 'COMPANY_ADMIN' || firestoreData.role === 'COMPANY_EMPLOYEE'
        ? firestoreData.role
        : ((customClaims.role as string) || firestoreData.role || 'STUDENT'),

      profilePictureUrl: firestoreData.profilePictureUrl || fbUser.photoURL || undefined,

      // Company fields: custom claims take priority
      companyId: (customClaims.companyId as string) || firestoreData.companyId,
      companyRole: (customClaims.companyRole as string) || firestoreData.companyRole,
      universityId: firestoreData.universityId,
    }

    // Step 4: Update Zustand store
    useAuthStore.getState().setAuth(userData, idToken)

    console.log('✅ [updateAuthStore] Store updated successfully:', {
      role: userData.role,
      companyId: userData.companyId,
      companyRole: userData.companyRole
    })
  } catch (error) {
    console.error('❌ [updateAuthStore] Failed to update auth store:', error)
    throw error
  }
}
