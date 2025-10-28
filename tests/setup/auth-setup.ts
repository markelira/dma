// Auth test setup file
import { jest } from '@jest/globals';

// Global test setup for authentication tests
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset environment variables
  delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  delete process.env.FIREBASE_DATABASE_URL;
});

afterEach(() => {
  // Clean up after each test
  jest.resetModules();
});

afterAll(() => {
  // Global cleanup
  jest.restoreAllMocks();
});

// Custom matchers for authentication tests
expect.extend({
  toBeValidUserRole(received) {
    const validRoles = ['student', 'instructor', 'university_admin', 'admin'];
    const pass = validRoles.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid user role`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid user role (one of: ${validRoles.join(', ')})`,
        pass: false,
      };
    }
  },
  
  toHavePermission(received, resource, action) {
    const permissions = received.permissions || [];
    const hasPermission = permissions.some((permission: any) => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });
    
    if (hasPermission) {
      return {
        message: () => `expected user not to have permission for ${action} on ${resource}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected user to have permission for ${action} on ${resource}`,
        pass: false,
      };
    }
  }
});

// Mock Firebase configuration
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'test-app',
    options: {}
  }))
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn()
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn()
  })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    region: 'us-central1'
  })),
  httpsCallable: jest.fn(() => jest.fn())
}));

// Export test utilities
export const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true
};

export const mockUserContext = {
  uid: 'test-uid',
  role: 'student' as const,
  email: 'test@example.com',
  displayName: 'Test User',
  permissions: [],
  emailVerified: true
};

export const mockAdminContext = {
  uid: 'admin-uid',
  role: 'admin' as const,
  email: 'admin@example.com',
  displayName: 'Admin User',
  permissions: [{ resource: '*', actions: ['*'] }],
  emailVerified: true
};

export const createMockCallableContext = (uid?: string) => ({
  auth: uid ? { uid } : null,
  rawRequest: {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent'
    }
  }
});

export const createMockFirebaseUser = (overrides = {}) => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  customClaims: {},
  ...overrides
});

// Type extensions for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUserRole(): R;
      toHavePermission(resource: string, action: string): R;
    }
  }
}