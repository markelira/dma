#!/usr/bin/env node

/**
 * Firebase Configuration Check Script
 * This script verifies that all required Firebase environment variables are set
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

console.log('🔍 Checking Firebase Configuration...\n');

let allRequiredPresent = true;
let missingVars = [];

// Check required environment variables
console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    allRequiredPresent = false;
    missingVars.push(varName);
  }
});

// Check optional environment variables
console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`  ⚠️  ${varName}: NOT SET (optional)`);
  }
});

// Summary
console.log('\n📊 Summary:');
if (allRequiredPresent) {
  console.log('✅ All required Firebase environment variables are set!');
  console.log('🚀 Ready for deployment.');
} else {
  console.log('❌ Missing required Firebase environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n🔧 To fix this:');
  console.log('   1. Go to your GitHub repository settings');
  console.log('   2. Navigate to Secrets and variables > Actions');
  console.log('   3. Add the missing environment variables');
  console.log('   4. Get the values from your Firebase project settings');
  process.exit(1);
}

console.log('\n🎯 Firebase configuration check completed!'); 