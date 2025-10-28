#!/usr/bin/env node

/**
 * ELIRA Firestore Rules Validation Script
 * 
 * Validates Firestore security rules syntax and structure.
 * Part of Step 5: Create Comprehensive Security Rules
 * 
 * Usage: npm run security:validate-firestore-rules
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 ELIRA Firestore Rules Validation');
console.log('=====================================\n');

const rulesFile = path.join(__dirname, '..', 'firestore.rules');

// Check if rules file exists
if (!fs.existsSync(rulesFile)) {
  console.error('❌ Error: firestore.rules file not found');
  process.exit(1);
}

// Read rules content
const rulesContent = fs.readFileSync(rulesFile, 'utf8');

console.log('📁 Validating rules file:', rulesFile);

// Basic syntax validation
const validationResults = {
  hasRulesVersion: false,
  hasService: false,
  hasMatchStatements: false,
  hasHelperFunctions: false,
  hasDefaultDenyRule: false,
  collections: [],
  helperFunctions: [],
  securityFeatures: []
};

// Check rules_version
if (rulesContent.includes("rules_version = '2'")) {
  validationResults.hasRulesVersion = true;
  console.log('✅ Rules version 2 detected');
} else {
  console.log('❌ Missing or incorrect rules_version');
}

// Check service declaration
if (rulesContent.includes('service cloud.firestore')) {
  validationResults.hasService = true;
  console.log('✅ Firestore service declaration found');
} else {
  console.log('❌ Missing Firestore service declaration');
}

// Check for match statements
const matchPattern = /match \/([^{]+)\{/g;
let matches = rulesContent.match(matchPattern);
if (matches && matches.length > 0) {
  validationResults.hasMatchStatements = true;
  console.log(`✅ Found ${matches.length} match statements`);
} else {
  console.log('❌ No match statements found');
}

// Check for helper functions
const helperFunctions = [
  'isAuthenticated',
  'isOwner',
  'getUserRole',
  'hasRole',
  'isInstructor',
  'isAdmin',
  'isUniversityAdmin',
  'isEnrolled',
  'canManageCourse',
  'isUniversityMember',
  'canManageUniversity',
  'isValidUserData',
  'isValidCourseData',
  'isAllowedUserUpdate'
];

console.log('\n🔧 Helper Functions Analysis:');
helperFunctions.forEach(func => {
  if (rulesContent.includes(`function ${func}(`)) {
    validationResults.helperFunctions.push(func);
    console.log(`✅ ${func}`);
  } else {
    console.log(`❌ Missing: ${func}`);
  }
});

if (validationResults.helperFunctions.length > 0) {
  validationResults.hasHelperFunctions = true;
}

// Check for critical collections
const expectedCollections = [
  'users',
  'courses', 
  'enrollments',
  'lessonProgress',
  'quizResults',
  'reviews',
  'categories',
  'universities',
  'payments',
  'notifications',
  'analytics',
  'config',
  'auditLogs'
];

console.log('\n📚 Collection Security Rules:');
expectedCollections.forEach(collection => {
  if (rulesContent.includes(`match /${collection}/`)) {
    validationResults.collections.push(collection);
    console.log(`✅ ${collection}`);
  } else {
    console.log(`❌ Missing: ${collection}`);
  }
});

// Check for default deny rule
if (rulesContent.includes('match /{document=**}') && rulesContent.includes('allow read, write: if false')) {
  validationResults.hasDefaultDenyRule = true;
  console.log('\n✅ Default deny rule found');
} else {
  console.log('\n❌ Missing default deny rule');
}

// Check for key security features
const securityFeatures = [
  { name: 'Role-based access control', pattern: /hasRole\(['"]/g },
  { name: 'Ownership validation', pattern: /isOwner\(/g },
  { name: 'Course management', pattern: /canManageCourse\(/g },
  { name: 'University multi-tenant', pattern: /isUniversityMember\(/g },
  { name: 'Data validation', pattern: /isValidUserData\(/g },
  { name: 'Immutable quiz results', pattern: /allow update: if false.*Quiz results/g },
  { name: 'Cloud Functions only', pattern: /allow create: if false.*Cloud Functions/g },
  { name: 'Field restriction', pattern: /isAllowedUserUpdate\(/g }
];

console.log('\n🛡️ Security Features Analysis:');
securityFeatures.forEach(feature => {
  if (feature.pattern.test(rulesContent)) {
    validationResults.securityFeatures.push(feature.name);
    console.log(`✅ ${feature.name}`);
  } else {
    console.log(`❌ Missing: ${feature.name}`);
  }
});

// Count rules
const allowRules = (rulesContent.match(/allow (read|write|create|update|delete)/g) || []).length;
const denyRules = (rulesContent.match(/allow .+: if false/g) || []).length;

console.log('\n📊 Rules Statistics:');
console.log(`📝 Total allow statements: ${allowRules}`);
console.log(`🚫 Explicit deny statements: ${denyRules}`);
console.log(`🔧 Helper functions: ${validationResults.helperFunctions.length}/${helperFunctions.length}`);
console.log(`📚 Protected collections: ${validationResults.collections.length}/${expectedCollections.length}`);
console.log(`🛡️ Security features: ${validationResults.securityFeatures.length}/${securityFeatures.length}`);

// Overall assessment
const totalChecks = 8;
let passedChecks = 0;

if (validationResults.hasRulesVersion) passedChecks++;
if (validationResults.hasService) passedChecks++;
if (validationResults.hasMatchStatements) passedChecks++;
if (validationResults.hasHelperFunctions) passedChecks++;
if (validationResults.hasDefaultDenyRule) passedChecks++;
if (validationResults.collections.length >= expectedCollections.length * 0.8) passedChecks++;
if (validationResults.helperFunctions.length >= helperFunctions.length * 0.8) passedChecks++;
if (validationResults.securityFeatures.length >= securityFeatures.length * 0.7) passedChecks++;

const scorePercentage = Math.round((passedChecks / totalChecks) * 100);

console.log('\n🎯 Validation Results:');
console.log(`📊 Score: ${passedChecks}/${totalChecks} (${scorePercentage}%)`);

if (scorePercentage >= 90) {
  console.log('🎉 Excellent! Firestore rules are comprehensive and secure.');
} else if (scorePercentage >= 75) {
  console.log('✅ Good! Firestore rules provide solid security with minor gaps.');
} else if (scorePercentage >= 60) {
  console.log('⚠️  Warning! Firestore rules have significant security gaps.');
} else {
  console.log('❌ Critical! Firestore rules are inadequate for production use.');
}

// Generate recommendations
console.log('\n💡 Recommendations:');
if (!validationResults.hasDefaultDenyRule) {
  console.log('- Add default deny rule to block undefined collections');
}
if (validationResults.helperFunctions.length < helperFunctions.length) {
  console.log('- Implement missing helper functions for better security');
}
if (validationResults.collections.length < expectedCollections.length * 0.9) {
  console.log('- Add security rules for missing collections');
}
if (validationResults.securityFeatures.length < securityFeatures.length * 0.8) {
  console.log('- Enhance security features (RBAC, validation, etc.)');
}

console.log('\n🚀 Next Steps:');
console.log('1. Fix any critical issues identified above');
console.log('2. Test rules with Firebase emulator: firebase emulators:start');
console.log('3. Deploy rules: firebase deploy --only firestore:rules');

// Return appropriate exit code
if (scorePercentage >= 75) {
  console.log('\n✅ Validation passed! Rules are ready for deployment.');
  process.exit(0);
} else {
  console.log('\n❌ Validation failed! Please fix critical issues before deployment.');
  process.exit(1);
}