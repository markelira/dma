'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db, functions } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  UNIVERSITY_ADMIN = 'university_admin',
  COMPANY_ADMIN = 'company_admin',
  COMPANY_EMPLOYEE = 'company_employee'
}

interface AuthUser extends User {
  role?: UserRole;
  universityId?: string;
  companyId?: string;
  companyRole?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: any) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission matrix - exact implementation from roadmap
const permissions: Record<UserRole, { resource: string; actions: string[] }[]> = {
  [UserRole.STUDENT]: [
    { resource: 'courses', actions: ['read', 'enroll'] },
    { resource: 'lessons', actions: ['read'] },
    { resource: 'quizzes', actions: ['read', 'submit'] },
    { resource: 'profile', actions: ['read', 'update'] }
  ],
  [UserRole.INSTRUCTOR]: [
    { resource: 'courses', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'lessons', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'quizzes', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'students', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] }
  ],
  [UserRole.ADMIN]: [
    { resource: '*', actions: ['*'] }
  ],
  [UserRole.UNIVERSITY_ADMIN]: [
    { resource: 'university', actions: ['read', 'update'] },
    { resource: 'departments', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'instructors', actions: ['read', 'create', 'update'] },
    { resource: 'courses', actions: ['read', 'approve'] },
    { resource: 'students', actions: ['read', 'create', 'update'] }
  ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch additional user data from Firestore and custom claims
  const fetchUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      // Force token refresh to get latest custom claims (including company data)
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const customClaims = idTokenResult.claims;

      // Fetch user document from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        return {
          ...firebaseUser,
          role: userData.role || customClaims.role,
          universityId: userData.universityId,
          companyId: userData.companyId || (customClaims.companyId as string | undefined),
          companyRole: userData.companyRole || (customClaims.companyRole as string | undefined)
        };
      } else {
        // If no Firestore document, fall back to custom claims
        return {
          ...firebaseUser,
          role: customClaims.role as UserRole | undefined,
          companyId: customClaims.companyId as string | undefined,
          companyRole: customClaims.companyRole as string | undefined
        };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return firebaseUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const enrichedUser = await fetchUserData(firebaseUser);
        setUser(enrichedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const enrichedUser = await fetchUserData(result.user);
      setUser(enrichedUser);
      
      // Redirect based on role - exact implementation from roadmap
      switch (enrichedUser.role) {
        case UserRole.ADMIN:
          router.push('/admin/dashboard');
          break;
        case UserRole.INSTRUCTOR:
          router.push('/instructor/dashboard');
          break;
        case UserRole.UNIVERSITY_ADMIN:
          router.push('/university/dashboard');
          break;
        case UserRole.COMPANY_ADMIN:
        case UserRole.COMPANY_EMPLOYEE:
          // Company users go to dedicated company dashboard
          router.push('/company/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email: string, password: string, userData: any): Promise<UserCredential> => {
    try {
      setError(null);

      // Create Firebase auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile
      await updateProfile(result.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Call Cloud Function to create user document
      console.log('[AUTH] 🚀 About to call createUserProfile:', {
        uid: result.user.uid,
        email: email,
        timestamp: new Date().toISOString()
      });

      const createUser = httpsCallable(functions, 'createUserProfile');

      console.log('[AUTH] 📞 httpsCallable created, making request...');

      const profileResult = await createUser({
        uid: result.user.uid,
        email,
        ...userData
      });

      console.log('[AUTH] ✅ createUserProfile success:', profileResult.data);

      const enrichedUser = await fetchUserData(result.user);
      setUser(enrichedUser);

      // Return userCredential so register page can show verification modal
      // Don't redirect here - let register page handle the flow
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if new user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      if (isNewUser) {
        // Create user profile
        const createUser = httpsCallable(functions, 'createUserProfile');
        await createUser({
          uid: result.user.uid,
          email: result.user.email,
          firstName: result.user.displayName?.split(' ')[0],
          lastName: result.user.displayName?.split(' ')[1] || '',
          photoURL: result.user.photoURL
        });
      }
      
      const enrichedUser = await fetchUserData(result.user);
      setUser(enrichedUser);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user?.role) return false;
    
    const rolePermissions = permissions[user.role];
    
    return rolePermissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  };

  const refreshUser = async () => {
    if (user) {
      const enrichedUser = await fetchUserData(user);
      setUser(enrichedUser);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    hasPermission,
    hasRole,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}