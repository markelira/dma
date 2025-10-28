/**
 * Global teardown for Day 3 Authentication tests
 * Runs after all tests to clean up test environment
 */

import { FullConfig } from '@playwright/test';
import { cleanupTestUsers } from './day3-test-setup';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting Day 3 Authentication Test Cleanup...\n');
  
  try {
    // Optional: Clean up test users
    // Note: In most cases, we keep test users for faster subsequent runs
    // Uncomment the line below if you want to clean up users after each test run
    
    // await cleanupTestUsers();
    
    console.log('✅ Day 3 Authentication Test Cleanup Complete!\n');
    console.log('📝 Test users remain in emulator for subsequent runs');
    console.log('   To clean up manually, restart Firebase emulators\n');
    
  } catch (error) {
    console.error('\n❌ Day 3 Authentication Test Cleanup Failed:', error);
    // Don't exit with error code as this is just cleanup
  }
}

export default globalTeardown;