import { AuthMiddleware } from '../../functions/src/auth/authMiddleware';
import { UserRole } from '../../functions/src/auth/roleManager';
import * as functions from 'firebase-functions';

// Mock Firebase functions
jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class extends Error {
      constructor(public code: string, message: string, public details?: any) {
        super(message);
      }
    }
  }
}));

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
      })),
      add: jest.fn()
    })),
    runTransaction: jest.fn(),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp')
    }
  })
}));

// Mock RoleManager
jest.mock('../../functions/src/auth/roleManager', () => ({
  RoleManager: {
    getUserContext: jest.fn(),
    hasPermission: jest.fn()
  },
  UserRole: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    UNIVERSITY_ADMIN: 'university_admin',
    ADMIN: 'admin'
  }
}));

import { RoleManager } from '../../functions/src/auth/roleManager';

describe('AuthMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyAuth', () => {
    test('should reject unauthenticated requests', async () => {
      const context = { auth: null };
      
      await expect(AuthMiddleware.verifyAuth(context as any))
        .rejects
        .toThrow('User must be authenticated to perform this action');
    });

    test('should reject when user context not found', async () => {
      const context = { auth: { uid: 'test-uid' } };
      (RoleManager.getUserContext as jest.Mock).mockResolvedValue(null);
      
      await expect(AuthMiddleware.verifyAuth(context as any))
        .rejects
        .toThrow('User context not found');
    });

    test('should return user context for authenticated user', async () => {
      const mockUserContext = {
        uid: 'test-uid',
        role: UserRole.STUDENT,
        email: 'test@example.com'
      };
      
      const context = { auth: { uid: 'test-uid' } };
      (RoleManager.getUserContext as jest.Mock).mockResolvedValue(mockUserContext);
      
      const result = await AuthMiddleware.verifyAuth(context as any);
      expect(result).toEqual(mockUserContext);
    });
  });

  describe('checkAuth', () => {
    const mockUserContext = {
      uid: 'test-uid',
      role: UserRole.INSTRUCTOR,
      email: 'test@example.com',
      universityId: 'univ-1'
    };

    beforeEach(() => {
      (RoleManager.getUserContext as jest.Mock).mockResolvedValue(mockUserContext);
    });

    test('should allow access with correct role', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = { requiredRole: UserRole.INSTRUCTOR };
      
      const result = await AuthMiddleware.checkAuth(context as any, options);
      expect(result).toEqual(mockUserContext);
    });

    test('should reject access with incorrect role', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = { requiredRole: UserRole.ADMIN };
      
      await expect(AuthMiddleware.checkAuth(context as any, options))
        .rejects
        .toThrow('Required role: admin, current role: instructor');
    });

    test('should allow access with multiple acceptable roles', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = { requiredRole: [UserRole.INSTRUCTOR, UserRole.ADMIN] };
      
      const result = await AuthMiddleware.checkAuth(context as any, options);
      expect(result).toEqual(mockUserContext);
    });

    test('should check permissions when required', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = {
        requiredPermission: {
          resource: 'courses',
          action: 'create'
        }
      };
      
      (RoleManager.hasPermission as jest.Mock).mockReturnValue(true);
      
      const result = await AuthMiddleware.checkAuth(context as any, options);
      expect(result).toEqual(mockUserContext);
      expect(RoleManager.hasPermission).toHaveBeenCalledWith(
        UserRole.INSTRUCTOR,
        'courses',
        'create',
        undefined
      );
    });

    test('should reject when permission check fails', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = {
        requiredPermission: {
          resource: 'users',
          action: 'delete'
        }
      };
      
      (RoleManager.hasPermission as jest.Mock).mockReturnValue(false);
      
      await expect(AuthMiddleware.checkAuth(context as any, options))
        .rejects
        .toThrow('Insufficient permissions for delete on users');
    });

    test('should allow self-access', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = { allowSelf: true };
      const resourceContext = { userId: 'test-uid' };
      
      const result = await AuthMiddleware.checkAuth(context as any, options, resourceContext);
      expect(result).toEqual(mockUserContext);
    });

    test('should reject non-self access without permissions', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = {
        allowSelf: true,
        requiredPermission: {
          resource: 'profile',
          action: 'read'
        }
      };
      const resourceContext = { userId: 'other-uid' };
      
      (RoleManager.hasPermission as jest.Mock).mockReturnValue(false);
      
      await expect(AuthMiddleware.checkAuth(context as any, options, resourceContext))
        .rejects
        .toThrow('Can only access own resources or require appropriate permissions');
    });

    test('should enforce university scope for university admin', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = { universityScope: true };
      const resourceContext = { universityId: 'other-univ' };
      
      await expect(AuthMiddleware.checkAuth(context as any, options, resourceContext))
        .rejects
        .toThrow('Access restricted to your university scope');
    });

    test('should allow university scope for same university', async () => {
      const context = { auth: { uid: 'test-uid' } };
      const options = { universityScope: true };
      const resourceContext = { universityId: 'univ-1' };
      
      const result = await AuthMiddleware.checkAuth(context as any, options, resourceContext);
      expect(result).toEqual(mockUserContext);
    });
  });

  describe('validateData', () => {
    test('should validate correct data', () => {
      const data = { name: 'test', age: 25 };
      const schema = require('zod').z.object({
        name: require('zod').z.string(),
        age: require('zod').z.number()
      });
      
      const result = AuthMiddleware.validateData(data, schema);
      expect(result).toEqual(data);
    });

    test('should reject invalid data', () => {
      const data = { name: 'test', age: 'invalid' };
      const schema = require('zod').z.object({
        name: require('zod').z.string(),
        age: require('zod').z.number()
      });
      
      expect(() => AuthMiddleware.validateData(data, schema))
        .toThrow('Invalid request data');
    });
  });

  describe('checkRateLimit', () => {
    const mockAdmin = require('firebase-admin');
    
    beforeEach(() => {
      mockAdmin.firestore().runTransaction.mockClear();
    });

    test('should allow requests within rate limit', async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: false
        }),
        set: jest.fn()
      };
      
      mockAdmin.firestore().runTransaction.mockImplementation((callback) => 
        callback(mockTransaction)
      );
      
      await expect(AuthMiddleware.checkRateLimit('user-id', 'action', 100, 60000))
        .resolves
        .toBeUndefined();
    });

    test('should reject requests exceeding rate limit', async () => {
      const now = Date.now();
      const requests = Array(101).fill(now); // 101 requests (exceeds limit of 100)
      
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

  describe('checkIPAccess', () => {
    test('should allow when no IP restrictions', () => {
      const context = {
        rawRequest: { ip: '192.168.1.1' }
      };
      
      expect(() => AuthMiddleware.checkIPAccess(context as any))
        .not
        .toThrow();
    });

    test('should allow requests from allowed IPs', () => {
      const context = {
        rawRequest: { ip: '192.168.1.1' }
      };
      const allowedIPs = ['192.168.1.1', '10.0.0.1'];
      
      expect(() => AuthMiddleware.checkIPAccess(context as any, allowedIPs))
        .not
        .toThrow();
    });

    test('should reject requests from disallowed IPs', () => {
      const context = {
        rawRequest: { ip: '192.168.1.100' }
      };
      const allowedIPs = ['192.168.1.1', '10.0.0.1'];
      
      expect(() => AuthMiddleware.checkIPAccess(context as any, allowedIPs))
        .toThrow('Access denied from this IP address');
    });

    test('should handle missing IP', () => {
      const context = {
        rawRequest: {}
      };
      const allowedIPs = ['192.168.1.1'];
      
      expect(() => AuthMiddleware.checkIPAccess(context as any, allowedIPs))
        .toThrow('Unable to verify client IP');
    });
  });

  describe('checkTimeAccess', () => {
    test('should allow when no time restrictions', () => {
      expect(() => AuthMiddleware.checkTimeAccess())
        .not
        .toThrow();
    });

    test('should allow requests within allowed hours', () => {
      // Mock current hour to be 10 AM
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      
      const allowedHours = { start: 9, end: 17 }; // 9 AM to 5 PM
      
      expect(() => AuthMiddleware.checkTimeAccess(allowedHours))
        .not
        .toThrow();
    });

    test('should reject requests outside allowed hours', () => {
      // Mock current hour to be 8 AM
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(8);
      
      const allowedHours = { start: 9, end: 17 }; // 9 AM to 5 PM
      
      expect(() => AuthMiddleware.checkTimeAccess(allowedHours))
        .toThrow('Access allowed only between 9:00 and 17:00');
    });
  });

  describe('logSecurityEvent', () => {
    const mockAdmin = require('firebase-admin');
    
    test('should log security events', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'log-id' });
      mockAdmin.firestore().collection().add = mockAdd;
      
      const context = {
        auth: { uid: 'test-uid' },
        rawRequest: {
          ip: '192.168.1.1',
          headers: { 'user-agent': 'test-agent' }
        }
      };
      
      await AuthMiddleware.logSecurityEvent('test_event', context as any, { extra: 'data' });
      
      expect(mockAdd).toHaveBeenCalledWith({
        event: 'test_event',
        uid: 'test-uid',
        timestamp: 'mock-timestamp',
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        details: { extra: 'data' }
      });
    });

    test('should handle logging errors gracefully', async () => {
      const mockAdd = jest.fn().mockRejectedValue(new Error('Logging failed'));
      mockAdmin.firestore().collection().add = mockAdd;
      
      const context = {
        auth: { uid: 'test-uid' },
        rawRequest: { ip: '192.168.1.1', headers: {} }
      };
      
      // Should not throw error
      await expect(AuthMiddleware.logSecurityEvent('test_event', context as any))
        .resolves
        .toBeUndefined();
    });
  });
});