// Mock setup that can be used by all test files

// Setup module path mapping for Jest
const path = require('path');

// Mock @sendgrid/mail
jest.doMock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));

// Mock firebase-functions
jest.doMock('firebase-functions', () => ({
  config: jest.fn(() => ({
    sendgrid: {
      key: 'test-sendgrid-key',
      from: 'test@elira.com',
      replyto: 'support@elira.com'
    },
    stripe: {
      secret_key: 'sk_test_123',
      webhook_secret: 'whsec_test_123'
    }
  })),
  https: {
    onCall: jest.fn(),
    onRequest: jest.fn()
  },
  firestore: {
    document: jest.fn(() => ({
      onCreate: jest.fn(),
      onUpdate: jest.fn(),
      onDelete: jest.fn()
    }))
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock firebase-admin
jest.doMock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({}),
          id: 'mock-doc-id'
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve())
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          docs: [],
          empty: true,
          size: 0
        }))
      }))
    }))
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    arrayUnion: jest.fn((value: any) => ({ arrayUnion: value })),
    arrayRemove: jest.fn((value: any) => ({ arrayRemove: value })),
    increment: jest.fn((value: number) => ({ increment: value })),
    delete: jest.fn(() => ({ delete: true }))
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getUser: jest.fn()
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        download: jest.fn(),
        delete: jest.fn(),
        getSignedUrl: jest.fn()
      }))
    }))
  })),
  apps: []
}));

export {};