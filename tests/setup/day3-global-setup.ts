/**
 * Global setup for Day 3 Authentication tests
 * Runs before all tests to set up test environment
 */

import { FullConfig } from '@playwright/test';
import { createTestUsers, verifyEmulatorsRunning } from './day3-test-setup';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting Day 3 Authentication Test Setup...\n');
  
  try {
    // Verify Firebase emulators are running
    console.log('1. Verifying Firebase emulators...');
    const emulatorsRunning = await verifyEmulatorsRunning();
    
    if (!emulatorsRunning) {
      console.error('\n❌ Firebase emulators are not running!');
      console.log('Please start them with: firebase emulators:start\n');
      process.exit(1);
    }
    
    // Wait a bit for emulators to be fully ready
    console.log('2. Waiting for emulators to be fully ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create test users
    console.log('3. Creating test users...');
    await createTestUsers();
    
    // Wait for user creation to complete
    console.log('4. Finalizing setup...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ Day 3 Authentication Test Setup Complete!\n');
    console.log('Test users created:');
    console.log('  📧 student@test.com (Student role)');
    console.log('  📧 instructor@test.com (Instructor role)');
    console.log('  📧 university_admin@test.com (University Admin role)');
    console.log('  📧 admin@test.com (Admin role)');
    console.log('  🔑 Password for all: Test123!\n');
    
    return {
      baseURL: config.projects[0]?.use?.baseURL || 'http://localhost:3000',
      testUsers: {
        student: 'student@test.com',
        instructor: 'instructor@test.com',
        universityAdmin: 'university_admin@test.com',
        admin: 'admin@test.com'
      }
    };
    
  } catch (error) {
    console.error('\n❌ Day 3 Authentication Test Setup Failed:', error);
    process.exit(1);
  }
}

export default globalSetup;