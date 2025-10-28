// Mock for firebase-admin package
export const mockFirestoreAdd = jest.fn();
export const mockFirestoreDoc = jest.fn();
export const mockFirestoreGet = jest.fn();
export const mockFirestoreUpdate = jest.fn();
export const mockFirestoreDelete = jest.fn();
export const mockFirestoreCollection = jest.fn();

// Mock Firestore instance
const mockFirestore = {
  collection: jest.fn((collectionName: string) => ({
    add: mockFirestoreAdd,
    doc: mockFirestoreDoc,
    get: mockFirestoreGet,
    where: jest.fn(() => ({
      get: mockFirestoreGet
    }))
  })),
  doc: jest.fn((docPath: string) => ({
    get: mockFirestoreGet,
    update: mockFirestoreUpdate,
    delete: mockFirestoreDelete,
    set: jest.fn()
  }))
};

// Mock apps array
const mockApps: any[] = [];

// Mock admin instance
const mockAdmin = {
  initializeApp: jest.fn(),
  firestore: jest.fn(() => mockFirestore),
  apps: mockApps,
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
  }))
};

export default mockAdmin;

// Reset function for tests
export const resetFirebaseAdminMocks = () => {
  mockFirestoreAdd.mockReset();
  mockFirestoreDoc.mockReset();
  mockFirestoreGet.mockReset();
  mockFirestoreUpdate.mockReset();
  mockFirestoreDelete.mockReset();
  mockFirestoreCollection.mockReset();
  mockAdmin.initializeApp.mockReset();
  mockAdmin.firestore.mockReset();
  mockApps.length = 0;
};

// Helper functions for common mock setups
export const mockFirestoreSuccess = (data: any = {}) => {
  mockFirestoreAdd.mockResolvedValue({ id: 'mock-doc-id', ...data });
  mockFirestoreGet.mockResolvedValue({
    exists: true,
    data: () => data,
    id: 'mock-doc-id'
  });
  mockFirestoreUpdate.mockResolvedValue(undefined);
  mockFirestoreDelete.mockResolvedValue(undefined);
};

export const mockFirestoreError = (error: string | Error) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  mockFirestoreAdd.mockRejectedValue(errorObj);
  mockFirestoreGet.mockRejectedValue(errorObj);
  mockFirestoreUpdate.mockRejectedValue(errorObj);
  mockFirestoreDelete.mockRejectedValue(errorObj);
};

export const mockDocumentNotFound = () => {
  mockFirestoreGet.mockResolvedValue({
    exists: false,
    data: () => null,
    id: null
  });
};

// Named exports for individual components
export const initializeApp = mockAdmin.initializeApp;
export const firestore = mockAdmin.firestore;
export const FieldValue = mockAdmin.FieldValue;
export const auth = mockAdmin.auth;
export const storage = mockAdmin.storage;
export const apps = mockApps;