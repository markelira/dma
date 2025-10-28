import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for email testing...');
  
  try {
    // Clean up any test data if needed
    console.log('🗑️ Cleaning up test data...');
    
    // In a real implementation, you might:
    // 1. Clean up test email logs from Firestore
    // 2. Reset SendGrid test state
    // 3. Clear any temporary files
    // 4. Clean up test user accounts
    
    // Clean up environment variables
    delete process.env.PLAYWRIGHT_TEST_ENV;
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;