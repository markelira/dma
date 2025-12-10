import { useMutation, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions, auth } from '@/lib/firebase'
import { useAuthStore, User, AuthResponse } from '@/stores/authStore'
import { signInWithEmailAndPassword } from 'firebase/auth'

/**
 * Translate Firebase Auth error codes to Hungarian user-friendly messages
 */
export function getAuthErrorMessage(error: any): string {
  const code = error?.code || '';

  switch (code) {
    // Login errors
    case 'auth/invalid-credential':
      return 'Hibás email cím vagy jelszó. Kérjük, ellenőrizd az adatokat.';
    case 'auth/user-not-found':
      return 'Nem található felhasználó ezzel az email címmel.';
    case 'auth/wrong-password':
      return 'Hibás jelszó. Kérjük, próbáld újra.';
    case 'auth/invalid-email':
      return 'Érvénytelen email cím formátum.';
    case 'auth/user-disabled':
      return 'Ez a fiók le van tiltva. Kérjük, vedd fel a kapcsolatot az ügyfélszolgálattal.';
    case 'auth/too-many-requests':
      return 'Túl sok sikertelen kísérlet. Kérjük, próbáld újra később.';

    // Registration errors
    case 'auth/email-already-in-use':
      return 'Ez az email cím már használatban van.';
    case 'auth/operation-not-allowed':
      return 'A művelet jelenleg nem elérhető.';
    case 'auth/weak-password':
      return 'A jelszó túl gyenge. Használj legalább 6 karaktert.';

    // Network errors
    case 'auth/network-request-failed':
      return 'Hálózati hiba történt. Kérjük, ellenőrizd az internetkapcsolatot.';

    // Other errors
    case 'auth/popup-closed-by-user':
      return 'A bejelentkezési ablak bezárult. Kérjük, próbáld újra.';
    case 'auth/requires-recent-login':
      return 'Biztonsági okokból újra be kell jelentkezned.';

    default:
      // If it has a custom message without code, pass it through
      if (error?.message && !code) {
        return error.message;
      }
      // Generic fallback
      return 'Hiba történt. Kérjük, próbáld újra.';
  }
}

export function useLogin() {
  const qc = useQueryClient()
  const { setAuth, clearAuth } = useAuthStore()

  return useMutation<AuthResponse, Error, { email: string; password: string }>({
    mutationFn: async ({ email, password }) => {
      try {
        // 1) Sign in to Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        console.log('✅ Firebase Auth sikeres:', userCredential.user.uid)
        
        // 2) Get Firebase ID token with custom claims
        const idToken = await userCredential.user.getIdToken(true)
        const tokenResult = await userCredential.user.getIdTokenResult(true)
        console.log('🔍 [RESEARCH] ID token custom claims:', {
          role: tokenResult.claims.role,
          companyId: tokenResult.claims.companyId,
          companyRole: tokenResult.claims.companyRole,
          allClaims: Object.keys(tokenResult.claims)
        })
        
        // 3) Get user data from Firestore
        console.log('📄 [DIAGNOSTIC] Checking Firestore user document', {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          timestamp: Date.now()
        })

        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')

        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))

        console.log('📄 [DIAGNOSTIC] Firestore document result', {
          exists: userDoc.exists(),
          hasData: userDoc.exists() && !!userDoc.data(),
          timestamp: Date.now()
        })

        if (!userDoc.exists()) {
          console.error('❌ [DIAGNOSTIC] User document NOT FOUND in Firestore for uid:', userCredential.user.uid)
          throw new Error('Felhasználói adatok nem találhatók')
        }

        const userData = userDoc.data()
        console.log('🔍 [RESEARCH] Raw Firestore user data:', {
          role: userData.role,
          companyId: userData.companyId,
          companyRole: userData.companyRole,
          email: userData.email,
          allFields: Object.keys(userData)
        })
        
        // Check if email is verified
        if (userData.emailVerified === false) {
          // Sign out the user if email is not verified
          await auth.signOut()
          throw new Error('Kérjük, először erősítse meg email címét a bejelentkezéshez.')
        }
        
        const userObject = {
          id: userCredential.user.uid,
          uid: userCredential.user.uid,
          email: userData.email || userCredential.user.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'STUDENT',
          profilePictureUrl: userData.profilePictureUrl || null,
          bio: userData.bio || null,
          title: userData.title || null,
          institution: userData.institution || null,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          companyId: userData.companyId,
          companyRole: userData.companyRole,
        };

        console.log('🔍 [RESEARCH] User object constructed in useLogin:', {
          role: userObject.role,
          companyId: userObject.companyId,
          companyRole: userObject.companyRole,
          hasCompanyId: !!userObject.companyId
        });

        return {
          success: true,
          user: userObject,
          accessToken: idToken,
        } as AuthResponse
        
        // 3) Exchange ID token for backend JWT (production only)
        const firebaseLogin = httpsCallable(functions, 'firebaseLogin')
        const result: any = await firebaseLogin({ idToken })
        return result.data as AuthResponse
      } catch (error: any) {
        console.error('❌ Login mutation error:', error)
        throw new Error(getAuthErrorMessage(error))
      }
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      qc.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: any) => {
      clearAuth()
      const msg = error?.message || 'Bejelentkezési hiba történt'
      console.error('Login error:', msg)
    },
  })
}

export function useRegister() {
  const qc = useQueryClient()
  const { clearAuth } = useAuthStore()

  return useMutation<AuthResponse, Error, { email: string; password: string; firstName: string; lastName: string }>({
    mutationFn: async (data) => {
      try {
        // Use Firebase Auth for registration
        console.log('🔧 Creating new user with Firebase Auth')
        
        // Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!passwordRegex.test(data.password)) {
          throw new Error('A jelszónak legalább 8 karakter hosszúnak kell lennie, tartalmaznia kell legalább egy nagybetűt és egy számot.')
        }
        
        // Create user in Firebase Auth
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
        const user = userCredential.user
        
        // Update display name
        await updateProfile(user, {
          displayName: `${data.firstName} ${data.lastName}`
        })
        
        // Get ID token
        const idToken = await user.getIdToken()
        
        // Create user document in Firestore with emailVerified set to false
        const { doc, setDoc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const userData = {
          id: user.uid,
          uid: user.uid,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'STUDENT',
          profilePictureUrl: null,
          bio: null,
          title: null,
          institution: null,
          emailVerified: false, // Email not verified yet
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        await setDoc(doc(db, 'users', user.uid), userData)
        console.log('✅ User document created in Firestore')
        
        // Send verification email
        try {
          const { httpsCallable } = await import('firebase/functions')
          const sendEmailVerification = httpsCallable(functions, 'sendEmailVerification')
          await sendEmailVerification({ 
            email: data.email,
            userId: user.uid 
          })
          console.log('✅ Verification email sent')
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError)
          // Don't fail registration if email fails
        }
        
        // Sign out the user immediately after registration
        // so they have to login manually
        await auth.signOut()
        console.log('✅ User signed out after registration')
        
        const mockResponse: AuthResponse = {
          success: true,
          user: userData as any,
          accessToken: idToken,
        }

        return mockResponse
      } catch (error: any) {
        console.error('Registration error:', error)
        throw new Error(getAuthErrorMessage(error))
      }
    },
    onSuccess: (data) => {
      // Don't auto-login after registration
      console.log('✅ Registration successful:', data.user.email)
    },
    onError: (error: any) => {
      clearAuth()
      const msg = error?.message || 'Regisztrációs hiba történt'
      console.error('Register error:', msg)
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const { setUser } = useAuthStore()
  return useMutation<User, Error, Partial<User>>({
    mutationFn: async (data) => {
      const updateProfile = httpsCallable(functions, 'updateProfile')
      const result = await updateProfile(data)
      return result.data.user as User
    },
    onSuccess: (data) => {
      setUser(data)
      qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
} 