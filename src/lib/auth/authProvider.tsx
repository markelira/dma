'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  reload
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  UNIVERSITY_ADMIN = 'university_admin'
}

export interface UserContext {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  universityId?: string;
  departmentId?: string;
  permissions: Array<{ resource: string; actions: string[] }>;
  emailVerified: boolean;
}

export interface AuthContextType {
  user: User | null;
  userContext: UserContext | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isUniversityAdmin: () => boolean;
  isInstructor: () => boolean;
  isStudent: () => boolean;
  canAccessCourse: (courseId: string, action?: string) => Promise<boolean>;
  refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  // Cloud Functions
  const getCurrentUserFunc = httpsCallable(functions, 'getCurrentUser');
  const validateCourseAccessFunc = httpsCallable(functions, 'validateCourseAccess');

  // Fetch user context from backend
  const fetchUserContext = async (firebaseUser: User): Promise<UserContext | null> => {
    try {
      // Get ID token to ensure fresh custom claims
      const idToken = await firebaseUser.getIdToken(true);
      const idTokenResult = await firebaseUser.getIdTokenResult();

      // Get user context from backend
      const result = await getCurrentUserFunc();
      const data = result.data as any;

      if (data.success) {
        return {
          uid: data.user.uid,
          email: data.user.email,
          displayName: firebaseUser.displayName,
          role: data.user.role || UserRole.STUDENT,
          universityId: data.user.universityId,
          departmentId: data.user.departmentId,
          permissions: data.permissions || [],
          emailVerified: firebaseUser.emailVerified
        };
      }

      // Fallback to basic user info
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: (idTokenResult.claims.role as UserRole) || UserRole.STUDENT,
        universityId: idTokenResult.claims.universityId as string,
        departmentId: idTokenResult.claims.departmentId as string,
        permissions: [],
        emailVerified: firebaseUser.emailVerified
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      
      // Fallback to basic user info
      const idTokenResult = await firebaseUser.getIdTokenResult();
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: (idTokenResult.claims.role as UserRole) || UserRole.STUDENT,
        universityId: idTokenResult.claims.universityId as string,
        departmentId: idTokenResult.claims.departmentId as string,
        permissions: [],
        emailVerified: firebaseUser.emailVerified
      };
    }
  };

  // Refresh user context
  const refreshUserContext = async (): Promise<void> => {
    if (user) {
      try {
        await user.reload();
        const context = await fetchUserContext(user);
        setUserContext(context);
      } catch (error) {
        console.error('Error refreshing user context:', error);
      }
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          const context = await fetchUserContext(firebaseUser);
          setUserContext(context);
        } else {
          setUserContext(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUserContext(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Force refresh to get updated custom claims
      await result.user.getIdToken(true);
      
      // Fetch user context
      const context = await fetchUserContext(result.user);
      setUserContext(context);
      
      // Create audit log entry for successful login
      try {
        await addDoc(collection(db, 'auditLogs'), {
          userId: result.user.uid,
          userEmail: result.user.email || '',
          userName: result.user.displayName || result.user.email || 'Unknown User',
          action: 'USER_LOGIN',
          resource: 'Authentication',
          resourceId: result.user.uid,
          details: JSON.stringify({
            method: 'email/password',
            timestamp: new Date().toISOString()
          }),
          severity: 'LOW',
          ipAddress: 'N/A',
          userAgent: navigator.userAgent,
          createdAt: new Date()
        });
      } catch (logError) {
        console.error('Failed to create audit log:', logError);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Transform Firebase errors to user-friendly messages
      let message = 'Bejelentkezési hiba történt.';
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'A felhasználó nem található.';
          break;
        case 'auth/wrong-password':
          message = 'Helytelen jelszó.';
          break;
        case 'auth/invalid-email':
          message = 'Érvénytelen email cím.';
          break;
        case 'auth/user-disabled':
          message = 'A felhasználói fiók le van tiltva.';
          break;
        case 'auth/too-many-requests':
          message = 'Túl sok próbálkozás. Kérjük, próbálja újra később.';
          break;
      }
      
      throw new Error(message);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, { displayName });
      
      // Default role is student - backend will handle user document creation
      const context: UserContext = {
        uid: result.user.uid,
        email: result.user.email,
        displayName,
        role: UserRole.STUDENT,
        permissions: [],
        emailVerified: result.user.emailVerified
      };
      
      setUserContext(context);
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Transform Firebase errors to user-friendly messages
      let message = 'Regisztrációs hiba történt.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Ez az email cím már használatban van.';
          break;
        case 'auth/invalid-email':
          message = 'Érvénytelen email cím.';
          break;
        case 'auth/weak-password':
          message = 'A jelszó túl gyenge. Minimum 6 karakter szükséges.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Email/jelszó regisztráció nincs engedélyezve.';
          break;
      }
      
      throw new Error(message);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Create audit log entry before logout
      if (user) {
        try {
          await addDoc(collection(db, 'auditLogs'), {
            userId: user.uid,
            userEmail: user.email || '',
            userName: user.displayName || user.email || 'Unknown User',
            action: 'USER_LOGOUT',
            resource: 'Authentication',
            resourceId: user.uid,
            details: JSON.stringify({
              timestamp: new Date().toISOString()
            }),
            severity: 'LOW',
            ipAddress: 'N/A',
            userAgent: navigator.userAgent,
            createdAt: new Date()
          });
        } catch (logError) {
          console.error('Failed to create audit log:', logError);
        }
      }
      
      await signOut(auth);
      setUserContext(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Kijelentkezési hiba történt.');
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let message = 'Jelszó visszaállítási hiba történt.';
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'A felhasználó nem található.';
          break;
        case 'auth/invalid-email':
          message = 'Érvénytelen email cím.';
          break;
      }
      
      throw new Error(message);
    }
  };

  // Permission checking functions
  const hasPermission = (resource: string, action: string): boolean => {
    if (!userContext) return false;
    
    return userContext.permissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userContext) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userContext.role);
  };

  const isAdmin = (): boolean => hasRole(UserRole.ADMIN);
  const isUniversityAdmin = (): boolean => hasRole(UserRole.UNIVERSITY_ADMIN);
  const isInstructor = (): boolean => hasRole(UserRole.INSTRUCTOR);
  const isStudent = (): boolean => hasRole(UserRole.STUDENT);

  const canAccessCourse = async (courseId: string, action: string = 'read'): Promise<boolean> => {
    if (!userContext) return false;

    try {
      const result = await validateCourseAccessFunc({ courseId, action });
      const data = result.data as any;
      return data.success && data.canAccess;
    } catch (error) {
      console.error('Error checking course access:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    userContext,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    hasPermission,
    hasRole,
    isAdmin,
    isUniversityAdmin,
    isInstructor,
    isStudent,
    canAccessCourse,
    refreshUserContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    requiredRole?: UserRole | UserRole[];
    fallbackPath?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, userContext, loading, hasRole } = useAuth();
    const { requireAuth = true, requiredRole, fallbackPath = '/login' } = options;

    // Show loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Check authentication requirement
    if (requireAuth && !user) {
      if (typeof window !== 'undefined') {
        window.location.href = fallbackPath;
      }
      return null;
    }

    // Check role requirement
    if (requiredRole && userContext && !hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Hozzáférés megtagadva
            </h1>
            <p className="text-gray-600">
              Nincs megfelelő jogosultsága az oldal megtekintéséhez.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for checking specific permissions
export function usePermissions() {
  const { userContext, hasPermission, hasRole } = useAuth();

  return {
    userContext,
    hasPermission,
    hasRole,
    canRead: (resource: string) => hasPermission(resource, 'read'),
    canCreate: (resource: string) => hasPermission(resource, 'create'),
    canUpdate: (resource: string) => hasPermission(resource, 'update'),
    canDelete: (resource: string) => hasPermission(resource, 'delete'),
    isAdmin: () => hasRole(UserRole.ADMIN),
    isUniversityAdmin: () => hasRole(UserRole.UNIVERSITY_ADMIN),
    isInstructor: () => hasRole(UserRole.INSTRUCTOR),
    isStudent: () => hasRole(UserRole.STUDENT),
    hasAdminPrivileges: () => hasRole([UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]),
    canCreateCourses: () => hasRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
    canManageUsers: () => hasRole([UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN])
  };
}

// Component for conditional rendering based on permissions
export function PermissionGate({
  children,
  permission,
  role,
  fallback = null
}: {
  children: React.ReactNode;
  permission?: { resource: string; action: string };
  role?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}) {
  const { hasPermission, hasRole } = useAuth();

  // Check permission if specified
  if (permission) {
    if (!hasPermission(permission.resource, permission.action)) {
      return <>{fallback}</>;
    }
  }

  // Check role if specified
  if (role) {
    if (!hasRole(role)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}