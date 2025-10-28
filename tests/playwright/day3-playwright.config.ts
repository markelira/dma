import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Day 3 Authentication & Authorization tests
 * 
 * Prerequisites:
 * 1. Firebase emulators must be running: firebase emulators:start
 * 2. Next.js dev server must be running: npm run dev
 * 3. Test users should be created in emulators
 */
export default defineConfig({
  testDir: './tests/playwright',
  testMatch: ['**/day3-*.spec.ts'],
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'tests/playwright-report/day3' }],
    ['json', { outputFile: 'tests/results/day3-results.json' }],
    ['junit', { outputFile: 'tests/results/day3-junit.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Use custom viewport for consistent testing */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/setup/day3-global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/day3-global-teardown.ts'),
  
  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'firebase emulators:start --only auth,firestore,functions',
      port: 9099, // Auth emulator port
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    }
  ],
  
  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 10000
  },
});