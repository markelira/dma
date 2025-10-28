import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Integration tests for the complete authentication system
describe('Authentication System Integration', () => {
  // Mock Firebase functions
  jest.mock('firebase-functions', () => ({
    https: {
      onCall: jest.fn((handler) => handler),
      HttpsError: class extends Error {
        constructor(public code: string, message: string) {
          super(message);
        }
      }
    }
  }));

  // Mock Firebase Admin
  jest.mock('firebase-admin', () => ({
    auth: () => ({
      setCustomUserClaims: jest.fn(),
      getUser: jest.fn(),
      createUser: jest.fn()
    }),
    firestore: () => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn()
        })),
        add: jest.fn(),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          }))
        }))
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => 'mock-timestamp')
      }
    })
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Role Assignment Flow', () => {
    test('should complete full role assignment workflow', async () => {
      // Import after mocks are set up
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      const { setUserRole } = await import('../../functions/src/auth/authActions');
      const { ClaimsManager } = await import('../../functions/src/auth/claimsManager');
      
      const mockAdmin = require('firebase-admin');

      // Mock admin user context
      const adminContext = {
        uid: 'admin-uid',
        role: UserRole.ADMIN,
        email: 'admin@test.com'
      };

      // Mock getUserContext to return admin
      jest.spyOn(RoleManager, 'getUserContext').mockResolvedValue(adminContext);
      
      // Mock validateUniversityRoleAssignment to return valid
      jest.spyOn(RoleManager, 'validateUniversityRoleAssignment').mockResolvedValue({
        valid: true
      });
      
      // Mock setUserRole to succeed
      jest.spyOn(RoleManager, 'setUserRole').mockResolvedValue();
      
      // Mock logging
      const AuthMiddleware = await import('../../functions/src/auth/authMiddleware');
      jest.spyOn(AuthMiddleware.AuthMiddleware, 'logSecurityEvent').mockResolvedValue();

      // Simulate role assignment request
      const data = {
        userId: 'target-user-id',
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1'
      };

      const context = {
        auth: { uid: 'admin-uid' },
        rawRequest: { ip: '127.0.0.1', headers: {} }
      };

      // Execute role assignment
      const result = await setUserRole(data, context as any);

      // Verify the complete flow
      expect(result.success).toBe(true);
      expect(result.userId).toBe('target-user-id');
      expect(result.role).toBe(UserRole.INSTRUCTOR);
      
      // Verify all components were called
      expect(RoleManager.getUserContext).toHaveBeenCalledWith('admin-uid');
      expect(RoleManager.validateUniversityRoleAssignment).toHaveBeenCalled();
      expect(RoleManager.setUserRole).toHaveBeenCalledWith(
        'target-user-id',
        UserRole.INSTRUCTOR,
        { universityId: 'univ-1', departmentId: undefined }
      );
      expect(AuthMiddleware.AuthMiddleware.logSecurityEvent).toHaveBeenCalledWith(
        'role_assigned',
        context,
        expect.objectContaining({
          targetUserId: 'target-user-id',
          newRole: UserRole.INSTRUCTOR
        })
      );
    });

    test('should reject unauthorized role assignment', async () => {
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      const { setUserRole } = await import('../../functions/src/auth/authActions');
      
      // Mock student user context (no permission to assign roles)
      const studentContext = {
        uid: 'student-uid',
        role: UserRole.STUDENT,
        email: 'student@test.com'
      };

      jest.spyOn(RoleManager, 'getUserContext').mockResolvedValue(studentContext);

      const data = {
        userId: 'target-user-id',
        role: UserRole.INSTRUCTOR
      };

      const context = {
        auth: { uid: 'student-uid' },
        rawRequest: { ip: '127.0.0.1', headers: {} }
      };

      // Should throw permission denied error
      await expect(setUserRole(data, context as any))
        .rejects
        .toThrow('Required role');
    });
  });

  describe('University Admin Scope Restrictions', () => {
    test('should enforce university scope for university admin', async () => {
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      const { setUserRole } = await import('../../functions/src/auth/authActions');
      
      // Mock university admin context
      const universityAdminContext = {
        uid: 'univ-admin-uid',
        role: UserRole.UNIVERSITY_ADMIN,
        email: 'univ-admin@test.com',
        universityId: 'univ-1'
      };

      jest.spyOn(RoleManager, 'getUserContext').mockResolvedValue(universityAdminContext);

      const data = {
        userId: 'target-user-id',
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-2' // Different university
      };

      const context = {
        auth: { uid: 'univ-admin-uid' },
        rawRequest: { ip: '127.0.0.1', headers: {} }
      };

      // Should throw permission denied for different university
      await expect(setUserRole(data, context as any))
        .rejects
        .toThrow('Can only assign roles within your university');
    });

    test('should allow university admin to assign roles within same university', async () => {
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      const { setUserRole } = await import('../../functions/src/auth/authActions');
      
      const universityAdminContext = {
        uid: 'univ-admin-uid',
        role: UserRole.UNIVERSITY_ADMIN,
        email: 'univ-admin@test.com',
        universityId: 'univ-1'
      };

      jest.spyOn(RoleManager, 'getUserContext').mockResolvedValue(universityAdminContext);
      jest.spyOn(RoleManager, 'validateUniversityRoleAssignment').mockResolvedValue({
        valid: true
      });
      jest.spyOn(RoleManager, 'setUserRole').mockResolvedValue();
      
      const AuthMiddleware = await import('../../functions/src/auth/authMiddleware');
      jest.spyOn(AuthMiddleware.AuthMiddleware, 'logSecurityEvent').mockResolvedValue();

      const data = {
        userId: 'target-user-id',
        role: UserRole.STUDENT,
        universityId: 'univ-1' // Same university
      };

      const context = {
        auth: { uid: 'univ-admin-uid' },
        rawRequest: { ip: '127.0.0.1', headers: {} }
      };

      const result = await setUserRole(data, context as any);

      expect(result.success).toBe(true);
    });
  });

  describe('Custom Claims Integration', () => {
    test('should synchronize role changes with custom claims', async () => {
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      const { ClaimsManager } = await import('../../functions/src/auth/claimsManager');
      
      const mockAdmin = require('firebase-admin');
      
      // Mock user with existing claims
      const mockUser = {
        customClaims: { role: UserRole.STUDENT }
      };
      
      mockAdmin.auth().getUser.mockResolvedValue(mockUser);
      mockAdmin.auth().setCustomUserClaims.mockResolvedValue(undefined);
      mockAdmin.firestore().collection().doc().update.mockResolvedValue(undefined);
      
      // Mock role permissions
      jest.spyOn(RoleManager, 'getRolePermissions').mockReturnValue([
        { resource: 'courses', actions: ['read', 'create'] }
      ]);

      // Update user role through ClaimsManager
      await ClaimsManager.setCustomClaims('test-uid', {
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1'
      });

      // Verify custom claims were updated with role and permissions
      expect(mockAdmin.auth().setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        role: UserRole.INSTRUCTOR,
        universityId: 'univ-1',
        permissions: ['courses:read,create'],
        lastUpdated: expect.any(Number)
      });

      // Verify Firestore document was updated
      expect(mockAdmin.firestore().collection().doc().update).toHaveBeenCalledWith({
        customClaims: expect.any(Object),
        claimsUpdatedAt: 'mock-timestamp',
        claimsUpdatedBy: 'system'
      });
    });
  });

  describe('Permission System Integration', () => {
    test('should correctly evaluate complex permission scenarios', async () => {
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      
      // Test hierarchical permissions
      expect(RoleManager.hasPermission(UserRole.ADMIN, 'courses', 'delete')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.INSTRUCTOR, 'courses', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'courses', 'read')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'courses', 'create')).toBe(false);
      
      // Test university admin scoped permissions
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'departments', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'instructors', 'create')).toBe(true);
      
      // Test permission denials
      expect(RoleManager.hasPermission(UserRole.INSTRUCTOR, 'users', 'delete')).toBe(false);
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'system', 'configure')).toBe(false);
    });
  });

  describe('Authentication Middleware Integration', () => {
    test('should enforce role-based access control in middleware', async () => {
      const { AuthMiddleware } = await import('../../functions/src/auth/authMiddleware');
      const { UserRole } = await import('../../functions/src/auth/roleManager');
      
      const mockRoleManager = await import('../../functions/src/auth/roleManager');
      
      // Mock user context
      const userContext = {
        uid: 'test-uid',
        role: UserRole.INSTRUCTOR,
        email: 'instructor@test.com'
      };
      
      jest.spyOn(mockRoleManager.RoleManager, 'getUserContext').mockResolvedValue(userContext);

      const context = {
        auth: { uid: 'test-uid' },
        rawRequest: { ip: '127.0.0.1', headers: {} }
      };

      // Test successful authentication with correct role
      const result = await AuthMiddleware.checkAuth(context as any, {
        requiredRole: UserRole.INSTRUCTOR
      });

      expect(result).toEqual(userContext);

      // Test failed authentication with incorrect role
      await expect(AuthMiddleware.checkAuth(context as any, {
        requiredRole: UserRole.ADMIN
      })).rejects.toThrow('Required role: admin, current role: instructor');
    });
  });

  describe('Audit Logging Integration', () => {
    test('should log all security events properly', async () => {
      const { AuthMiddleware } = await import('../../functions/src/auth/authMiddleware');
      const mockAdmin = require('firebase-admin');
      
      const mockAdd = jest.fn().mockResolvedValue({ id: 'log-id' });
      mockAdmin.firestore().collection().add = mockAdd;

      const context = {
        auth: { uid: 'test-uid' },
        rawRequest: {
          ip: '192.168.1.1',
          headers: { 'user-agent': 'test-browser' }
        }
      };

      await AuthMiddleware.logSecurityEvent('test_event', context as any, {
        action: 'role_assignment',
        targetUser: 'target-uid'
      });

      expect(mockAdd).toHaveBeenCalledWith({
        event: 'test_event',
        uid: 'test-uid',
        timestamp: 'mock-timestamp',
        ip: '192.168.1.1',
        userAgent: 'test-browser',
        details: {
          action: 'role_assignment',
          targetUser: 'target-uid'
        }
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle authentication failures gracefully', async () => {
      const { AuthMiddleware } = await import('../../functions/src/auth/authMiddleware');
      
      // Test unauthenticated request
      const context = { auth: null };
      
      await expect(AuthMiddleware.verifyAuth(context as any))
        .rejects
        .toThrow('User must be authenticated to perform this action');
    });

    test('should handle database errors gracefully', async () => {
      const { RoleManager } = await import('../../functions/src/auth/roleManager');
      const mockAdmin = require('firebase-admin');
      
      // Mock database error
      mockAdmin.auth().getUser.mockRejectedValue(new Error('Database connection failed'));
      
      const result = await RoleManager.getUserRole('test-uid');
      
      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should enforce rate limits correctly', async () => {
      const { AuthMiddleware } = await import('../../functions/src/auth/authMiddleware');
      const mockAdmin = require('firebase-admin');
      
      // Mock rate limit exceeded scenario
      const now = Date.now();
      const requests = Array(101).fill(now); // Exceeds limit of 100
      
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ requests })
        }),
        update: jest.fn()
      };
      
      mockAdmin.firestore().runTransaction.mockImplementation((callback) => 
        callback(mockTransaction)
      );
      
      await expect(AuthMiddleware.checkRateLimit('user-id', 'action', 100, 60000))
        .rejects
        .toThrow('Rate limit exceeded');
    });
  });
});