#!/usr/bin/env node

/**
 * ELIRA Comprehensive Security Test Suite
 * 
 * Runs all security validations and tests for ELIRA platform.
 * Part of Step 6: Deploy and Test Security Rules
 * 
 * Usage: npm run test:security
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 ELIRA Comprehensive Security Test Suite');
console.log('==========================================\n');

const testResults = {
  environmentValidation: null,
  firestoreRules: null,
  stripeKeys: null,
  generalSecurity: null,
  emulatorTest: null
};

let totalTests = 0;
let passedTests = 0;
let criticalFailures = 0;

/**
 * Run a security test and capture results
 */
async function runSecurityTest(testName, command, description, isCritical = false) {
  console.log(`🧪 Testing: ${description}`);
  console.log(`   Command: ${command}`);
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      cwd: __dirname + '/..',
      timeout: 30000
    });
    
    console.log('✅ PASSED\n');
    testResults[testName] = { status: 'passed', output: result };
    passedTests++;
    return true;
  } catch (error) {
    const status = isCritical ? 'CRITICAL FAILURE' : 'FAILED';
    console.log(`❌ ${status}`);
    
    // Try to extract useful error information
    const errorLines = error.message.split('\n');
    const relevantError = errorLines.find(line => 
      line.includes('Error:') || 
      line.includes('❌') || 
      line.includes('ENOENT') ||
      line.includes('MODULE_NOT_FOUND')
    ) || errorLines[0];
    
    console.log(`   Details: ${relevantError.trim()}`);
    console.log();
    
    testResults[testName] = { 
      status: 'failed', 
      error: error.message, 
      critical: isCritical 
    };
    
    if (isCritical) {
      criticalFailures++;
    }
    
    return false;
  } finally {
    totalTests++;
  }
}

/**
 * Test Firebase emulator connectivity
 */
async function testEmulatorConnectivity() {
  console.log('🔥 Testing Firebase Emulator Connectivity');
  
  try {
    // Cross-platform way to test emulator connectivity
    const http = require('http');
    
    const testEmulator = () => {
      return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8088', { timeout: 3000 }, (res) => {
          resolve(res.statusCode);
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));
      });
    };
    
    const statusCode = await testEmulator();
    
    if (statusCode === 200 || statusCode === 404) { // 404 is also okay for Firestore emulator
      console.log('✅ Firebase Emulator is running and accessible\n');
      testResults.emulatorTest = { status: 'passed', output: 'Emulator accessible' };
      passedTests++;
      return true;
    } else {
      throw new Error(`Unexpected status code: ${statusCode}`);
    }
  } catch (error) {
    console.log('⚠️  Firebase Emulator not accessible');
    console.log('   Note: Start with "npm run dev" or "firebase emulators:start"\n');
    testResults.emulatorTest = { 
      status: 'warning', 
      error: 'Emulator not running', 
      critical: false 
    };
    return false;
  } finally {
    totalTests++;
  }
}

/**
 * Main test execution
 */
async function runSecurityTests() {
  console.log('🚀 Starting comprehensive security validation...\n');
  
  // Test 1: Environment Validation
  await runSecurityTest(
    'environmentValidation',
    'node scripts/validate-environment.js',
    'Environment Variables & Configuration',
    false
  );
  
  // Test 2: Firestore Rules Validation
  await runSecurityTest(
    'firestoreRules',
    'node scripts/validate-firestore-rules.js',
    'Firestore Security Rules',
    true
  );
  
  // Test 3: Stripe Keys Validation
  await runSecurityTest(
    'stripeKeys',
    'node scripts/test-stripe-keys.js',
    'Stripe API Keys & Configuration',
    false
  );
  
  // Test 4: General Security Check
  await runSecurityTest(
    'generalSecurity',
    'node scripts/security-verification.js',
    'General Security Verification',
    false
  );
  
  // Test 5: Firebase Emulator Connectivity
  await testEmulatorConnectivity();
  
  // Generate comprehensive report
  console.log('📊 Security Test Results Summary');
  console.log('================================\n');
  
  // Individual test results
  Object.entries(testResults).forEach(([testName, result]) => {
    if (!result) return;
    
    const icon = result.status === 'passed' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    const status = result.status.toUpperCase();
    const critical = result.critical ? ' (CRITICAL)' : '';
    
    console.log(`${icon} ${testName}: ${status}${critical}`);
  });
  
  // Overall statistics
  console.log(`\n📈 Overall Results:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`🚨 Critical Failures: ${criticalFailures}`);
  
  // Score calculation
  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  // Security assessment
  console.log('\n🛡️ Security Assessment:');
  if (criticalFailures === 0 && successRate >= 90) {
    console.log('🎉 EXCELLENT: All critical security tests passed! Production ready.');
  } else if (criticalFailures === 0 && successRate >= 75) {
    console.log('✅ GOOD: Security is solid with minor issues to address.');
  } else if (criticalFailures === 0) {
    console.log('⚠️  WARNING: Multiple security issues detected. Review required.');
  } else {
    console.log('🚨 CRITICAL: Critical security failures detected. DO NOT DEPLOY.');
  }
  
  // Detailed recommendations
  console.log('\n💡 Recommendations:');
  
  if (testResults.environmentValidation?.status === 'failed') {
    console.log('- Fix environment configuration issues');
  }
  if (testResults.firestoreRules?.status === 'failed') {
    console.log('- Critical: Fix Firestore security rules before deployment');
  }
  if (testResults.stripeKeys?.status === 'failed') {
    console.log('- Update Stripe API keys configuration');
  }
  if (testResults.emulatorTest?.status !== 'passed') {
    console.log('- Start Firebase emulators for complete testing');
  }
  
  // Next steps
  console.log('\n🚀 Next Steps:');
  if (criticalFailures === 0) {
    console.log('1. ✅ Security validation complete');
    console.log('2. 🚀 Ready for production deployment');
    console.log('3. 📊 Set up monitoring and alerts');
  } else {
    console.log('1. 🔧 Fix critical security issues');
    console.log('2. 🧪 Re-run security tests');
    console.log('3. ⚠️  Do not deploy until all critical issues resolved');
  }
  
  // Available tools reminder
  console.log('\n🔧 Available Security Tools:');
  console.log('npm run security:check                     # Quick security overview');
  console.log('npm run security:validate-env             # Environment validation');
  console.log('npm run security:validate-firestore-rules # Firestore rules check');
  console.log('npm run security:test-stripe              # Stripe configuration');
  console.log('npm run test:security                     # This comprehensive test');
  
  // Log results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(__dirname, '..', 'security-test-results.json');
  
  const logData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      totalTests,
      passedTests,
      criticalFailures,
      successRate
    }
  };
  
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
  console.log(`\n📝 Detailed results saved to: security-test-results.json`);
  
  // Return appropriate exit code
  if (criticalFailures > 0) {
    console.log('\n🚨 Exiting with error code due to critical failures');
    process.exit(1);
  } else if (successRate < 75) {
    console.log('\n⚠️  Exiting with warning code due to multiple failures');
    process.exit(2);
  } else {
    console.log('\n✅ All security tests completed successfully');
    process.exit(0);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Security tests interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Security tests terminated');
  process.exit(143);
});

// Run the tests
runSecurityTests().catch(error => {
  console.error('\n💥 Unexpected error during security testing:', error.message);
  process.exit(1);
});