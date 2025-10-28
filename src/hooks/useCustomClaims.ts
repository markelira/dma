'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/authProvider';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { UserRole } from '@/lib/auth/authProvider';

export interface CustomClaims {
  role: UserRole;
  universityId?: string;
  departmentId?: string;
  permissions?: string[];
  lastUpdated?: number;
}

export interface ClaimsValidation {
  consistent: boolean;
  issues: string[];
  recommendations: string[];
}

interface UseCustomClaimsReturn {
  claims: CustomClaims | null;
  loading: boolean;
  error: string | null;
  validation: ClaimsValidation | null;
  refreshClaims: () => Promise<void>;
  validateClaims: () => Promise<void>;
  updateClaims: (userId: string, newClaims: Partial<CustomClaims>) => Promise<void>;
  removeClaims: (userId: string, claimsToRemove: (keyof CustomClaims)[]) => Promise<void>;
  getAuditLog: (userId: string, limit?: number) => Promise<any[]>;
}

export function useCustomClaims(targetUserId?: string): UseCustomClaimsReturn {
  const { user, userContext, refreshUserContext } = useAuth();
  const [claims, setClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ClaimsValidation | null>(null);

  // Cloud Functions
  const getCustomClaimsFunc = httpsCallable(functions, 'getCustomClaims');
  const refreshCustomClaimsFunc = httpsCallable(functions, 'refreshCustomClaims');
  const validateClaimsConsistencyFunc = httpsCallable(functions, 'validateClaimsConsistency');
  const updateCustomClaimsFunc = httpsCallable(functions, 'updateCustomClaims');
  const removeCustomClaimsFunc = httpsCallable(functions, 'removeCustomClaims');
  const getClaimsAuditLogFunc = httpsCallable(functions, 'getClaimsAuditLog');

  const userId = targetUserId || user?.uid;

  // Get custom claims
  const getClaims = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getCustomClaimsFunc({ userId });
      const data = result.data as any;

      if (data.success) {
        setClaims(data.claims);
      } else {
        setError(data.error || 'Failed to get custom claims');
      }
    } catch (err: any) {
      console.error('Error getting custom claims:', err);
      setError(err.message || 'Failed to get custom claims');
    } finally {
      setLoading(false);
    }
  }, [userId, getCustomClaimsFunc]);

  // Refresh custom claims
  const refreshClaims = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await refreshCustomClaimsFunc({ userId });
      const data = result.data as any;

      if (data.success) {
        setClaims(data.claims);
        
        // If refreshing own claims, also refresh user context
        if (userId === user?.uid) {
          await refreshUserContext();
        }
      } else {
        setError(data.error || 'Failed to refresh custom claims');
      }
    } catch (err: any) {
      console.error('Error refreshing custom claims:', err);
      setError(err.message || 'Failed to refresh custom claims');
    } finally {
      setLoading(false);
    }
  }, [userId, refreshCustomClaimsFunc, user?.uid, refreshUserContext]);

  // Validate claims consistency
  const validateClaims = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await validateClaimsConsistencyFunc({ userId });
      const data = result.data as any;

      if (data.success) {
        setValidation(data.validation);
      } else {
        setError(data.error || 'Failed to validate claims');
      }
    } catch (err: any) {
      console.error('Error validating claims:', err);
      setError(err.message || 'Failed to validate claims');
    } finally {
      setLoading(false);
    }
  }, [userId, validateClaimsConsistencyFunc]);

  // Update custom claims (admin only)
  const updateClaims = useCallback(async (targetUserId: string, newClaims: Partial<CustomClaims>) => {
    try {
      setLoading(true);
      setError(null);

      const result = await updateCustomClaimsFunc({
        userId: targetUserId,
        claims: newClaims
      });
      const data = result.data as any;

      if (data.success) {
        // Refresh claims if updating current user
        if (targetUserId === userId) {
          await getClaims();
        }
      } else {
        setError(data.error || 'Failed to update custom claims');
      }
    } catch (err: any) {
      console.error('Error updating custom claims:', err);
      setError(err.message || 'Failed to update custom claims');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, updateCustomClaimsFunc, getClaims]);

  // Remove custom claims (admin only)
  const removeClaims = useCallback(async (targetUserId: string, claimsToRemove: (keyof CustomClaims)[]) => {
    try {
      setLoading(true);
      setError(null);

      const result = await removeCustomClaimsFunc({
        userId: targetUserId,
        claimsToRemove
      });
      const data = result.data as any;

      if (data.success) {
        // Refresh claims if updating current user
        if (targetUserId === userId) {
          await getClaims();
        }
      } else {
        setError(data.error || 'Failed to remove custom claims');
      }
    } catch (err: any) {
      console.error('Error removing custom claims:', err);
      setError(err.message || 'Failed to remove custom claims');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, removeCustomClaimsFunc, getClaims]);

  // Get claims audit log (admin only)
  const getAuditLog = useCallback(async (targetUserId: string, limit: number = 50): Promise<any[]> => {
    try {
      const result = await getClaimsAuditLogFunc({
        userId: targetUserId,
        limit
      });
      const data = result.data as any;

      if (data.success) {
        return data.auditLog;
      } else {
        throw new Error(data.error || 'Failed to get audit log');
      }
    } catch (err: any) {
      console.error('Error getting claims audit log:', err);
      throw err;
    }
  }, [getClaimsAuditLogFunc]);

  // Load claims on mount and user change
  useEffect(() => {
    if (userId) {
      getClaims();
    }
  }, [userId, getClaims]);

  // Auto-validate claims if they seem outdated
  useEffect(() => {
    if (claims?.lastUpdated && userContext?.uid === userId) {
      const daysSinceUpdate = (Date.now() - claims.lastUpdated) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 1) {
        validateClaims();
      }
    }
  }, [claims, userContext, userId, validateClaims]);

  return {
    claims,
    loading,
    error,
    validation,
    refreshClaims,
    validateClaims,
    updateClaims,
    removeClaims,
    getAuditLog
  };
}

// Helper hook for claims management operations (admin only)
export function useClaimsManagement() {
  const { userContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloud Functions
  const batchUpdateCustomClaimsFunc = httpsCallable(functions, 'batchUpdateCustomClaims');
  const cleanupExpiredClaimsFunc = httpsCallable(functions, 'cleanupExpiredClaims');

  // Check if user has admin privileges
  const isAdmin = userContext?.role === UserRole.ADMIN;
  const isUniversityAdmin = userContext?.role === UserRole.UNIVERSITY_ADMIN;
  const hasAdminPrivileges = isAdmin || isUniversityAdmin;

  // Batch update claims
  const batchUpdateClaims = useCallback(async (updates: Array<{
    userId: string;
    claims: Partial<CustomClaims>;
  }>) => {
    if (!hasAdminPrivileges) {
      throw new Error('Admin privileges required');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await batchUpdateCustomClaimsFunc({ updates });
      const data = result.data as any;

      if (!data.success) {
        setError(data.error || 'Failed to batch update claims');
        throw new Error(data.error || 'Failed to batch update claims');
      }

      return data.results;
    } catch (err: any) {
      console.error('Error in batch update claims:', err);
      setError(err.message || 'Failed to batch update claims');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hasAdminPrivileges, batchUpdateCustomClaimsFunc]);

  // Cleanup expired claims
  const cleanupExpiredClaims = useCallback(async (maxAgeHours: number = 24 * 7) => {
    if (!isAdmin) {
      throw new Error('Admin privileges required');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await cleanupExpiredClaimsFunc({ maxAgeHours });
      const data = result.data as any;

      if (!data.success) {
        setError(data.error || 'Failed to cleanup expired claims');
        throw new Error(data.error || 'Failed to cleanup expired claims');
      }

      return data.results;
    } catch (err: any) {
      console.error('Error cleaning up expired claims:', err);
      setError(err.message || 'Failed to cleanup expired claims');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin, cleanupExpiredClaimsFunc]);

  return {
    loading,
    error,
    isAdmin,
    isUniversityAdmin,
    hasAdminPrivileges,
    batchUpdateClaims,
    cleanupExpiredClaims
  };
}