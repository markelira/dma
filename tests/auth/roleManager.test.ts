import { RoleManager, UserRole } from '../../functions/src/auth/roleManager';

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
      }))
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp')
    }
  })
}));

jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    }
  }
}));

describe('RoleManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    test('should allow admin full access', () => {
      expect(RoleManager.hasPermission(UserRole.ADMIN, 'courses', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.ADMIN, 'users', 'delete')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.ADMIN, 'anything', 'anything')).toBe(true);
    });

    test('should allow student basic permissions', () => {
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'courses', 'read')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'courses', 'enroll')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'quizzes', 'submit')).toBe(true);
    });

    test('should deny student advanced permissions', () => {
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'courses', 'create')).toBe(false);
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'courses', 'delete')).toBe(false);
      expect(RoleManager.hasPermission(UserRole.STUDENT, 'users', 'read')).toBe(false);
    });

    test('should allow instructor course management', () => {
      expect(RoleManager.hasPermission(UserRole.INSTRUCTOR, 'courses', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.INSTRUCTOR, 'courses', 'update')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.INSTRUCTOR, 'lessons', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.INSTRUCTOR, 'analytics', 'read')).toBe(true);
    });

    test('should allow university admin departmental access', () => {
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'departments', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'instructors', 'create')).toBe(true);
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'courses', 'approve')).toBe(true);
    });

    test('should deny university admin system-level access', () => {
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'system', 'configure')).toBe(false);
      expect(RoleManager.hasPermission(UserRole.UNIVERSITY_ADMIN, 'users', 'delete')).toBe(false);
    });

    test('should handle invalid role gracefully', () => {
      expect(RoleManager.hasPermission('invalid_role' as UserRole, 'courses', 'read')).toBe(false);
    });
  });

  describe('canChangeRole', () => {
    test('should allow admin to change any role', () => {
      expect(RoleManager.canChangeRole(UserRole.ADMIN, UserRole.STUDENT)).toBe(true);
      expect(RoleManager.canChangeRole(UserRole.ADMIN, UserRole.INSTRUCTOR)).toBe(true);
      expect(RoleManager.canChangeRole(UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN)).toBe(true);
      expect(RoleManager.canChangeRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
    });

    test('should allow university admin limited role changes', () => {
      expect(RoleManager.canChangeRole(UserRole.UNIVERSITY_ADMIN, UserRole.STUDENT)).toBe(true);
      expect(RoleManager.canChangeRole(UserRole.UNIVERSITY_ADMIN, UserRole.INSTRUCTOR)).toBe(true);
    });

    test('should deny university admin admin role assignment', () => {
      expect(RoleManager.canChangeRole(UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN)).toBe(false);
      expect(RoleManager.canChangeRole(UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_ADMIN)).toBe(false);
    });

    test('should deny student and instructor role changes', () => {
      expect(RoleManager.canChangeRole(UserRole.STUDENT, UserRole.INSTRUCTOR)).toBe(false);
      expect(RoleManager.canChangeRole(UserRole.INSTRUCTOR, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('getRoleHierarchy', () => {
    test('should return correct role hierarchy', () => {
      const hierarchy = RoleManager.getRoleHierarchy();
      
      expect(hierarchy[UserRole.STUDENT]).toBe(1);
      expect(hierarchy[UserRole.INSTRUCTOR]).toBe(2);
      expect(hierarchy[UserRole.UNIVERSITY_ADMIN]).toBe(3);
      expect(hierarchy[UserRole.ADMIN]).toBe(4);
    });
  });

  describe('hasHigherPrivilege', () => {
    test('should correctly compare role privileges', () => {
      expect(RoleManager.hasHigherPrivilege(UserRole.ADMIN, UserRole.STUDENT)).toBe(true);
      expect(RoleManager.hasHigherPrivilege(UserRole.INSTRUCTOR, UserRole.STUDENT)).toBe(true);
      expect(RoleManager.hasHigherPrivilege(UserRole.UNIVERSITY_ADMIN, UserRole.INSTRUCTOR)).toBe(true);
      expect(RoleManager.hasHigherPrivilege(UserRole.STUDENT, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    test('should return all permissions for a role', () => {
      const studentPermissions = RoleManager.getRolePermissions(UserRole.STUDENT);
      expect(studentPermissions).toHaveLength(9); // Based on our permission setup
      
      const adminPermissions = RoleManager.getRolePermissions(UserRole.ADMIN);
      expect(adminPermissions).toHaveLength(1); // Should have wildcard permission
      expect(adminPermissions[0].resource).toBe('*');
      expect(adminPermissions[0].actions).toEqual(['*']);
    });

    test('should return empty array for invalid role', () => {
      const permissions = RoleManager.getRolePermissions('invalid' as UserRole);
      expect(permissions).toEqual([]);
    });
  });

  describe('validateUniversityRoleAssignment', () => {
    const mockAdmin = require('firebase-admin');
    
    beforeEach(() => {
      // Reset mocks
      mockAdmin.auth().getUser.mockClear();
      mockAdmin.firestore().collection().doc().get.mockClear();
    });

    test('should validate admin role assignment', async () => {
      // Mock requestor as admin
      mockAdmin.firestore().collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ role: UserRole.ADMIN, uid: 'admin-user-id' })
      });
      
      mockAdmin.auth().getUser.mockResolvedValueOnce({
        uid: 'target-user-id',
        email: 'test@example.com'
      });

      const result = await RoleManager.validateUniversityRoleAssignment(
        'target-user-id',
        UserRole.INSTRUCTOR,
        'university-1',
        'admin-user-id'
      );

      expect(result.valid).toBe(true);
    });

    test('should reject university admin assigning admin roles', async () => {
      // Mock requestor as university admin
      mockAdmin.firestore().collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ 
          role: UserRole.UNIVERSITY_ADMIN, 
          uid: 'univ-admin-id',
          universityId: 'university-1'
        })
      });

      const result = await RoleManager.validateUniversityRoleAssignment(
        'target-user-id',
        UserRole.ADMIN,
        'university-1',
        'univ-admin-id'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });

    test('should reject cross-university role assignment', async () => {
      // Mock requestor as university admin
      mockAdmin.firestore().collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ 
          role: UserRole.UNIVERSITY_ADMIN, 
          uid: 'univ-admin-id',
          universityId: 'university-1'
        })
      });

      const result = await RoleManager.validateUniversityRoleAssignment(
        'target-user-id',
        UserRole.INSTRUCTOR,
        'university-2', // Different university
        'univ-admin-id'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot assign roles outside your university');
    });
  });

  describe('batchUpdateRoles', () => {
    const mockAdmin = require('firebase-admin');
    
    test('should process batch role updates successfully', async () => {
      // Mock successful role assignment
      jest.spyOn(RoleManager, 'setUserRole').mockResolvedValue();

      const updates = [
        { userId: 'user1', role: UserRole.STUDENT, universityId: 'univ1' },
        { userId: 'user2', role: UserRole.INSTRUCTOR, universityId: 'univ1' }
      ];

      const result = await RoleManager.batchUpdateRoles(updates);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle partial failures in batch update', async () => {
      // Mock one success, one failure
      jest.spyOn(RoleManager, 'setUserRole')
        .mockResolvedValueOnce() // First call succeeds
        .mockRejectedValueOnce(new Error('Role assignment failed')); // Second call fails

      const updates = [
        { userId: 'user1', role: UserRole.STUDENT },
        { userId: 'user2', role: UserRole.INSTRUCTOR }
      ];

      const result = await RoleManager.batchUpdateRoles(updates);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].userId).toBe('user2');
    });
  });
});