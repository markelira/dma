const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Auth Tests',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/auth/**/*.test.ts',
    '<rootDir>/tests/auth/**/*.spec.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/auth-setup.ts'
  ],
  
  // Module name mapping for TypeScript paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'functions/src/auth/**/*.ts',
    'src/lib/auth/**/*.ts',
    'src/hooks/useCustomClaims.ts',
    'src/components/auth/**/*.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.config.ts'
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  coverageDirectory: '<rootDir>/coverage/auth',
  
  // Transformation settings
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/auth-global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/auth-global-teardown.ts'
};