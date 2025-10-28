import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'day4-5-payment.spec.ts',
  timeout: 60000,
  retries: 2,
  workers: 1, // Run tests sequentially for payment tests

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Mock Stripe in all tests to avoid real payments
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
        }
      },
    },
    {
      name: 'mobile',
      use: { 
        ...require('@playwright/test').devices['iPhone 12'],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  expect: {
    timeout: 10000,
  },

  reporter: [
    ['html', { outputFolder: 'test-results/day4-5-payment' }],
    ['json', { outputFile: 'test-results/day4-5-payment.json' }],
    ['line'],
  ],

  outputDir: 'test-results/day4-5-payment-artifacts',
});