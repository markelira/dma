module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/tests/**/*.test.ts'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/functions/node_modules'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'functions/src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!functions/src/**/*.d.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
  extensionsToTreatAsEsm: []
}; 