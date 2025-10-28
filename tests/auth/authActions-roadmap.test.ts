import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Test the roadmap Step 3 authentication actions
describe('Authentication Actions - Roadmap Step 3', () => {
  // Mock Firebase functions
  jest.mock('firebase-functions', () => ({
    https: {
      onCall: jest.fn((handler) => handler),
      HttpsError: class extends Error {
        constructor(public code: string, message: string, public details?: any) {
          super(message);
        }
      }
    }
  }));

  // Mock Firebase Admin
  jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    auth: () => ({
      createCustomToken: jest.fn()
    }),
    firestore: () => ({
      collection: jest.fn(() => ({
        add: jest.fn(),
        doc: jest.fn(() => ({
          get: jest.fn()
        }))
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => 'mock-timestamp')
      }
    })
  }));

  // Mock middleware
  jest.mock('../../functions/src/middleware/authMiddleware', () => ({
    requireAuth: jest.fn(),
    requireRole: jest.fn()
  }));

  // Mock RoleManager
  jest.mock('../../functions/src/auth/roleManager', () => ({
    RoleManager: {
      getUserRole: jest.fn(),
      canChangeRole: jest.fn(),
      setUserRole: jest.fn()
    },
    UserRole: {
      STUDENT: 'student',
      INSTRUCTOR: 'instructor',
      UNIVERSITY_ADMIN: 'university_admin',
      ADMIN: 'admin'
    }
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setUserRole', () => {
    test('should allow admin to change user role', async () => {
      // Dynamic import after mocks are set up
      const { setUserRole } = await import('../../functions/src/authActions');
      const { requireRole } = await import('../../functions/src/middleware/authMiddleware');
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');
      const mockAdmin = require('firebase-admin');

      // Mock middleware to allow admin access
      (requireRole as jest.Mock).mockResolvedValue({
        uid: 'admin-uid',
        role: UserRole.ADMIN
      });

      // Mock role manager methods
      (RoleManager.getUserRole as jest.Mock).mockResolvedValue(UserRole.ADMIN);
      (RoleManager.canChangeRole as jest.Mock).mockReturnValue(true);
      (RoleManager.setUserRole as jest.Mock).mockResolvedValue(undefined);

      // Mock Firestore add
      const mockAdd = jest.fn().mockResolvedValue({ id: 'log-id' });
      mockAdmin.firestore().collection().add = mockAdd;

      const data = {
        userId: 'target-user-id',
        role: UserRole.INSTRUCTOR
      };

      const context = {
        auth: { uid: 'admin-uid' }
      };

      const result = await setUserRole(data, context as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role updated successfully');
      expect(RoleManager.setUserRole).toHaveBeenCalledWith('target-user-id', UserRole.INSTRUCTOR);
      expect(mockAdd).toHaveBeenCalledWith({
        action: 'ROLE_CHANGE',
        performedBy: 'admin-uid',
        targetUser: 'target-user-id',
        newRole: UserRole.INSTRUCTOR,
        timestamp: 'mock-timestamp'
      });
    });

    test('should reject role change if not authorized', async () => {
      const { setUserRole } = await import('../../functions/src/authActions');
      const { RoleManager, UserRole } = await import('../../functions/src/auth/roleManager');

      // Mock role manager to reject change
      (RoleManager.getUserRole as jest.Mock).mockResolvedValue(UserRole.INSTRUCTOR);
      (RoleManager.canChangeRole as jest.Mock).mockReturnValue(false);

      const data = {
        userId: 'target-user-id',
        role: UserRole.ADMIN
      };

      const context = {
        auth: { uid: 'instructor-uid' }
      };

      await expect(setUserRole(data, context as any))
        .rejects
        .toThrow('Cannot assign this role');
    });
  });

  describe('getCurrentUser', () => {
    test('should return current user profile with role', async () => {
      const { getCurrentUser } = await import('../../functions/src/authActions');
      const { requireAuth } = await import('../../functions/src/middleware/authMiddleware');
      const { UserRole } = await import('../../functions/src/auth/roleManager');
      const mockAdmin = require('firebase-admin');

      // Mock authentication
      const mockAuthContext = {
        uid: 'test-uid',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };
      (requireAuth as jest.Mock).mockResolvedValue(mockAuthContext);

      // Mock Firestore document
      const mockUserData = {
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        password: 'should-be-removed',
        resetToken: 'should-be-removed'
      };
      
      const mockDoc = {
        exists: true,
        data: () => mockUserData
      };
      
      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockDoc);

      const context = {
        auth: { uid: 'test-uid' }
      };

      const result = await getCurrentUser({}, context as any);

      expect(result.uid).toBe('test-uid');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe(UserRole.STUDENT);
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');
      expect(result.password).toBeUndefined();
      expect(result.resetToken).toBeUndefined();
    });

    test('should handle user not found', async () => {
      const { getCurrentUser } = await import('../../functions/src/authActions');
      const { requireAuth } = await import('../../functions/src/middleware/authMiddleware');
      const mockAdmin = require('firebase-admin');

      // Mock authentication
      (requireAuth as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'student'
      });

      // Mock user not found
      const mockDoc = { exists: false };
      mockAdmin.firestore().collection().doc().get.mockResolvedValue(mockDoc);

      const context = {
        auth: { uid: 'test-uid' }
      };

      await expect(getCurrentUser({}, context as any))
        .rejects
        .toThrow('User profile not found');
    });
  });

  describe('impersonateUser', () => {
    test('should allow admin to impersonate user', async () => {
      const { impersonateUser } = await import('../../functions/src/authActions');
      const { requireRole } = await import('../../functions/src/middleware/authMiddleware');
      const { UserRole } = await import('../../functions/src/auth/roleManager');
      const mockAdmin = require('firebase-admin');

      // Mock admin role requirement
      (requireRole as jest.Mock).mockResolvedValue({
        uid: 'admin-uid',
        role: UserRole.ADMIN
      });

      // Mock custom token creation
      const mockToken = 'custom-token-123';
      mockAdmin.auth().createCustomToken.mockResolvedValue(mockToken);

      // Mock audit log
      const mockAdd = jest.fn().mockResolvedValue({ id: 'log-id' });
      mockAdmin.firestore().collection().add = mockAdd;

      const data = {
        userId: 'target-user-id'
      };

      const context = {
        auth: { uid: 'admin-uid' }
      };

      const result = await impersonateUser(data, context as any);

      expect(result.success).toBe(true);
      expect(result.token).toBe(mockToken);
      expect(mockAdmin.auth().createCustomToken).toHaveBeenCalledWith('target-user-id', {
        impersonatedBy: 'admin-uid',
        impersonationExpiry: expect.any(Number)
      });
      expect(mockAdd).toHaveBeenCalledWith({
        action: 'IMPERSONATION_START',
        performedBy: 'admin-uid',
        targetUser: 'target-user-id',
        timestamp: 'mock-timestamp'
      });
    });

    test('should reject impersonation for non-admin users', async () => {
      const { requireRole } = await import('../../functions/src/middleware/authMiddleware');
      const functions = require('firebase-functions');

      // Mock role requirement failure
      (requireRole as jest.Mock).mockRejectedValue(
        new functions.https.HttpsError('permission-denied', 'Admin role required')
      );

      const { impersonateUser } = await import('../../functions/src/authActions');

      const data = {
        userId: 'target-user-id'
      };

      const context = {
        auth: { uid: 'student-uid' }
      };

      await expect(impersonateUser(data, context as any))
        .rejects
        .toThrow('Admin role required');
    });
  });

  describe('Input Validation', () => {
    test('should validate setUserRole input', async () => {
      const { setUserRole } = await import('../../functions/src/authActions');

      const invalidData = {
        userId: '', // Invalid: empty string
        role: 'invalid_role' // Invalid: not a valid UserRole
      };

      const context = {
        auth: { uid: 'admin-uid' }
      };

      await expect(setUserRole(invalidData, context as any))
        .rejects
        .toThrow('Validációs hiba');
    });

    test('should validate impersonateUser input', async () => {
      const { impersonateUser } = await import('../../functions/src/authActions');

      const invalidData = {
        userId: '' // Invalid: empty string
      };

      const context = {
        auth: { uid: 'admin-uid' }
      };

      await expect(impersonateUser(invalidData, context as any))
        .rejects
        .toThrow('Validációs hiba');
    });
  });
});