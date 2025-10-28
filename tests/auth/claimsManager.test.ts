import { ClaimsManager, CustomClaims } from '../../functions/src/auth/claimsManager';
import { UserRole } from '../../functions/src/auth/roleManager';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  auth: () => ({
    setCustomUserClaims: jest.fn(),
    getUser: jest.fn()
  }),
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn(),
        get: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          }))
        }))
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp')
    }
  })
}));

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    }
  }
}));

// Mock RoleManager
jest.mock('../../functions/src/auth/roleManager', () => ({
  RoleManager: {
    getRolePermissions: jest.fn()
  },
  UserRole: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    UNIVERSITY_ADMIN: 'university_admin',
    ADMIN: 'admin'
  }
}));

import { RoleManager } from '../../functions/src/auth/roleManager';

describe('ClaimsManager', () => {
  const mockAdmin = require('firebase-admin');
  
  beforeEach(() => {
    jest.clearAllMocks();
    Date.now = jest.fn(() => 1234567890);
  });

  describe('setCustomClaims', () => {
    test('should set custom claims successfully', async () => {
      const mockUser = {
        customClaims: { existingClaim: 'value' }
      };
      
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);
      mockAdmin.auth().setCustomUserClaims.mockResolvedValue(undefined);
      mockAdmin.firestore().collection().doc().update.mockResolvedValue(undefined);
      (RoleManager.getRolePermissions as jest.Mock).mockReturnValue([
        { resource: 'courses', actions: ['read', 'create'] }
      ]);

      const claims: Partial<CustomClaims> = {
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1'
      };

      await ClaimsManager.setCustomClaims('test-uid', claims, 'admin-uid');

      expect(mockAdmin.auth().setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        existingClaim: 'value',
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1',
        permissions: ['courses:read,create'],
        lastUpdated: 1234567890
      });

      expect(mockAdmin.firestore().collection().doc().update).toHaveBeenCalledWith({
        customClaims: expect.any(Object),
        claimsUpdatedAt: 'mock-timestamp',
        claimsUpdatedBy: 'admin-uid'
      });
    });

    test('should handle missing user gracefully', async () => {
      mockAdmin.auth().getUser.mockRejectedValue(new Error('User not found'));

      await expect(ClaimsManager.setCustomClaims('invalid-uid', { role: UserRole.STUDENT }))
        .rejects
        .toThrow('Failed to set custom claims');
    });

    test('should merge with existing claims', async () => {
      const mockUser = {
        customClaims: { 
          role: UserRole.STUDENT,
          existingField: 'keep-this'
        }
      };
      
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);
      mockAdmin.auth().setCustomUserClaims.mockResolvedValue(undefined);
      mockAdmin.firestore().collection().doc().update.mockResolvedValue(undefined);

      const newClaims: Partial<CustomClaims> = {
        universityId: 'univ-1'
      };

      await ClaimsManager.setCustomClaims('test-uid', newClaims);

      expect(mockAdmin.auth().setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        role: UserRole.STUDENT,
        existingField: 'keep-this',
        universityId: 'univ-1',
        lastUpdated: 1234567890
      });
    });
  });

  describe('getCustomClaims', () => {
    test('should return custom claims', async () => {
      const mockClaims = {
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1',
        lastUpdated: 1234567890
      };
      
      const mockUser = { customClaims: mockClaims };
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);

      const result = await ClaimsManager.getCustomClaims('test-uid');

      expect(result).toEqual(mockClaims);
    });

    test('should return null for missing claims', async () => {
      const mockUser = { customClaims: null };
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);

      const result = await ClaimsManager.getCustomClaims('test-uid');

      expect(result).toBeNull();
    });

    test('should handle user not found', async () => {
      mockAdmin.auth().getUser.mockRejectedValue(new Error('User not found'));

      const result = await ClaimsManager.getCustomClaims('invalid-uid');

      expect(result).toBeNull();
    });
  });

  describe('removeCustomClaims', () => {
    test('should remove specified claims', async () => {
      const mockUser = {
        customClaims: {
          role: UserRole.INSTRUCTOR,
          universityId: 'univ-1',
          departmentId: 'dept-1',
          permissions: ['courses:read,create']
        }
      };
      
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);
      mockAdmin.auth().setCustomUserClaims.mockResolvedValue(undefined);
      mockAdmin.firestore().collection().doc().update.mockResolvedValue(undefined);

      await ClaimsManager.removeCustomClaims('test-uid', ['universityId', 'departmentId'], 'admin-uid');

      expect(mockAdmin.auth().setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        role: UserRole.INSTRUCTOR,
        permissions: ['courses:read,create'],
        lastUpdated: 1234567890
      });
    });

    test('should handle removal of non-existent claims', async () => {
      const mockUser = {
        customClaims: { role: UserRole.STUDENT }
      };
      
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);
      mockAdmin.auth().setCustomUserClaims.mockResolvedValue(undefined);
      mockAdmin.firestore().collection().doc().update.mockResolvedValue(undefined);

      await ClaimsManager.removeCustomClaims('test-uid', ['universityId']);

      expect(mockAdmin.auth().setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        role: UserRole.STUDENT,
        lastUpdated: 1234567890
      });
    });
  });

  describe('refreshUserClaims', () => {
    test('should refresh claims from database', async () => {
      // Mock RoleManager.getUserContext
      const mockUserContext = {
        uid: 'test-uid',
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1',
        departmentId: 'dept-1'
      };
      
      // We need to mock RoleManager.getUserContext
      const originalGetUserContext = require('../../functions/src/auth/roleManager').RoleManager.getUserContext;
      require('../../functions/src/auth/roleManager').RoleManager.getUserContext = jest.fn().mockResolvedValue(mockUserContext);
      
      (RoleManager.getRolePermissions as jest.Mock).mockReturnValue([
        { resource: 'courses', actions: ['read', 'create'] }
      ]);
      
      mockAdmin.auth().setCustomUserClaims.mockResolvedValue(undefined);
      mockAdmin.firestore().collection().doc().update.mockResolvedValue(undefined);

      const result = await ClaimsManager.refreshUserClaims('test-uid');

      expect(result).toEqual({
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1',
        departmentId: 'dept-1',
        permissions: ['courses:read,create'],
        lastUpdated: 1234567890
      });

      // Restore original method
      require('../../functions/src/auth/roleManager').RoleManager.getUserContext = originalGetUserContext;
    });

    test('should handle user not found during refresh', async () => {
      const originalGetUserContext = require('../../functions/src/auth/roleManager').RoleManager.getUserContext;
      require('../../functions/src/auth/roleManager').RoleManager.getUserContext = jest.fn().mockResolvedValue(null);

      await expect(ClaimsManager.refreshUserClaims('invalid-uid'))
        .rejects
        .toThrow('User context not found');

      require('../../functions/src/auth/roleManager').RoleManager.getUserContext = originalGetUserContext;
    });
  });

  describe('batchUpdateClaims', () => {
    test('should process batch updates successfully', async () => {
      jest.spyOn(ClaimsManager, 'setCustomClaims').mockResolvedValue();

      const updates = [
        { userId: 'user1', claims: { role: UserRole.STUDENT } },
        { userId: 'user2', claims: { role: UserRole.INSTRUCTOR } }
      ];

      const result = await ClaimsManager.batchUpdateClaims(updates, 'admin-uid');

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle partial failures', async () => {
      jest.spyOn(ClaimsManager, 'setCustomClaims')
        .mockResolvedValueOnce() // First succeeds
        .mockRejectedValueOnce(new Error('Update failed')); // Second fails

      const updates = [
        { userId: 'user1', claims: { role: UserRole.STUDENT } },
        { userId: 'user2', claims: { role: UserRole.INSTRUCTOR } }
      ];

      const result = await ClaimsManager.batchUpdateClaims(updates);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].userId).toBe('user2');
    });
  });

  describe('validateClaimsConsistency', () => {
    test('should validate consistent claims', async () => {
      const mockAuthUser = {
        customClaims: {
          role: UserRole.INSTRUCTOR,
          universityId: 'univ-1',
          lastUpdated: Date.now() - 1000 // 1 second ago
        }
      };
      
      const mockFirestoreDoc = {
        exists: true,
        data: () => ({
          role: UserRole.INSTRUCTOR,
          universityId: 'univ-1'
        })
      };

      mockAdmin.auth().getUser.mockResolvedValue(mockAuthUser);
      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockFirestoreDoc);

      const result = await ClaimsManager.validateClaimsConsistency('test-uid');

      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('should detect role mismatch', async () => {
      const mockAuthUser = {
        customClaims: {
          role: UserRole.INSTRUCTOR,
          universityId: 'univ-1',
          lastUpdated: Date.now()
        }
      };
      
      const mockFirestoreDoc = {
        exists: true,
        data: () => ({
          role: UserRole.STUDENT, // Different role
          universityId: 'univ-1'
        })
      };

      mockAdmin.auth().getUser.mockResolvedValue(mockAuthUser);
      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockFirestoreDoc);

      const result = await ClaimsManager.validateClaimsConsistency('test-uid');

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Role mismatch: Auth(instructor) vs Firestore(student)');
      expect(result.recommendations).toContain('Sync role between Auth and Firestore');
    });

    test('should detect outdated claims', async () => {
      const mockAuthUser = {
        customClaims: {
          role: UserRole.INSTRUCTOR,
          lastUpdated: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
        }
      };
      
      const mockFirestoreDoc = {
        exists: true,
        data: () => ({ role: UserRole.INSTRUCTOR })
      };

      mockAdmin.auth().getUser.mockResolvedValue(mockAuthUser);
      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockFirestoreDoc);

      const result = await ClaimsManager.validateClaimsConsistency('test-uid');

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Custom claims are outdated (>24 hours)');
      expect(result.recommendations).toContain('Refresh custom claims');
    });
  });

  describe('getClaimsAuditLog', () => {
    test('should return audit log entries', async () => {
      const mockLogEntries = [
        { id: 'log1', action: 'claims_updated', timestamp: new Date() },
        { id: 'log2', action: 'claims_refreshed', timestamp: new Date() }
      ];
      
      const mockSnapshot = {
        docs: mockLogEntries.map(entry => ({
          id: entry.id,
          data: () => entry
        }))
      };

      mockAdmin.firestore().collection().where().orderBy().limit().get.mockResolvedValue(mockSnapshot);

      const result = await ClaimsManager.getClaimsAuditLog('test-uid', 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'log1', action: 'claims_updated', timestamp: expect.any(Date) });
    });

    test('should handle audit log errors', async () => {
      mockAdmin.firestore().collection().where().orderBy().limit().get.mockRejectedValue(new Error('Database error'));

      const result = await ClaimsManager.getClaimsAuditLog('test-uid');

      expect(result).toEqual([]);
    });
  });

  describe('cleanupExpiredClaims', () => {
    test('should process expired claims cleanup', async () => {
      const mockUsers = [
        { id: 'user1', data: () => ({ role: UserRole.STUDENT }) },
        { id: 'user2', data: () => ({ role: UserRole.INSTRUCTOR }) }
      ];
      
      const mockSnapshot = { docs: mockUsers };
      mockAdmin.firestore().collection().where().limit().get.mockResolvedValue(mockSnapshot);
      
      // Mock validation to return inconsistent for first user
      jest.spyOn(ClaimsManager, 'validateClaimsConsistency')
        .mockResolvedValueOnce({ consistent: false, issues: ['outdated'], recommendations: ['refresh'] })
        .mockResolvedValueOnce({ consistent: true, issues: [], recommendations: [] });
      
      jest.spyOn(ClaimsManager, 'refreshUserClaims').mockResolvedValue({} as any);

      const result = await ClaimsManager.cleanupExpiredClaims(24);

      expect(result.processed).toBe(2);
      expect(result.updated).toBe(1);
      expect(result.errors).toBe(0);
    });

    test('should handle cleanup errors gracefully', async () => {
      const mockUsers = [
        { id: 'user1', data: () => ({ role: UserRole.STUDENT }) }
      ];
      
      const mockSnapshot = { docs: mockUsers };
      mockAdmin.firestore().collection().where().limit().get.mockResolvedValue(mockSnapshot);
      
      jest.spyOn(ClaimsManager, 'validateClaimsConsistency')
        .mockRejectedValue(new Error('Validation failed'));

      const result = await ClaimsManager.cleanupExpiredClaims();

      expect(result.processed).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toBe(1);
    });
  });
});