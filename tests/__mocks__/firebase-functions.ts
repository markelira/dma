// Mock for firebase-functions package

// Mock configuration
let mockConfig = {
  sendgrid: {
    key: 'test-sendgrid-key',
    from: 'test@elira.com',
    replyto: 'support@elira.com'
  },
  stripe: {
    secret_key: 'sk_test_123',
    webhook_secret: 'whsec_test_123'
  },
  mux: {
    token_id: 'test-mux-token',
    token_secret: 'test-mux-secret'
  }
};

// Config function
export const config = jest.fn(() => mockConfig);

// Set custom config for testing
export const setMockConfig = (newConfig: any) => {
  mockConfig = { ...mockConfig, ...newConfig };
};

export const resetMockConfig = () => {
  mockConfig = {
    sendgrid: {
      key: 'test-sendgrid-key',
      from: 'test@elira.com',
      replyto: 'support@elira.com'
    },
    stripe: {
      secret_key: 'sk_test_123',
      webhook_secret: 'whsec_test_123'
    },
    mux: {
      token_id: 'test-mux-token',
      token_secret: 'test-mux-secret'
    }
  };
};

// Mock function types
export const mockOnCall = jest.fn();
export const mockOnRequest = jest.fn();
export const mockOnDocumentCreated = jest.fn();
export const mockOnDocumentUpdated = jest.fn();
export const mockOnDocumentDeleted = jest.fn();
export const mockOnSchedule = jest.fn();

// Mock HTTPS functions
export const https = {
  onCall: mockOnCall,
  onRequest: mockOnRequest
};

// Mock Firestore triggers
export const firestore = {
  document: jest.fn((path: string) => ({
    onCreate: mockOnDocumentCreated,
    onUpdate: mockOnDocumentUpdated,
    onDelete: mockOnDocumentDeleted
  }))
};

// Mock scheduler
export const pubsub = {
  schedule: jest.fn((schedule: string) => ({
    onRun: mockOnSchedule
  }))
};

// Mock logger
export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock region function
export const region = jest.fn(() => ({
  https,
  firestore,
  pubsub
}));

// Reset function for tests
export const resetFunctionsMocks = () => {
  config.mockReset();
  mockOnCall.mockReset();
  mockOnRequest.mockReset();
  mockOnDocumentCreated.mockReset();
  mockOnDocumentUpdated.mockReset();
  mockOnDocumentDeleted.mockReset();
  mockOnSchedule.mockReset();
  logger.info.mockReset();
  logger.warn.mockReset();
  logger.error.mockReset();
  logger.debug.mockReset();
  resetMockConfig();
};

// Helper to mock function context
export const mockFunctionContext = (auth?: any, rawRequest?: any) => ({
  auth: auth || null,
  rawRequest: rawRequest || {},
  instanceIdToken: 'test-instance-token'
});

// Helper to mock authenticated user
export const mockAuthenticatedUser = (uid: string = 'test-user-id', email: string = 'test@example.com') => ({
  uid,
  email,
  email_verified: true,
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  iss: 'https://securetoken.google.com/test-project',
  aud: 'test-project',
  auth_time: Date.now() / 1000,
  iat: Date.now() / 1000,
  exp: (Date.now() / 1000) + 3600,
  firebase: {
    identities: {
      email: [email]
    },
    sign_in_provider: 'password'
  }
});

export default {
  config,
  https,
  firestore,
  pubsub,
  logger,
  region
};