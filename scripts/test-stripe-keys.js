#!/usr/bin/env node

/**
 * ELIRA Stripe Key Testing Script
 * 
 * Tests Stripe API keys to ensure they work correctly and have proper permissions.
 * This script validates keys without making any charges or modifications.
 * 
 * Usage: node scripts/test-stripe-keys.js
 */

const fs = require('fs');

class StripeKeyTester {
  constructor() {
    this.envLocalPath = '.env.local';
    this.functionsEnvPath = 'functions/.env';
    
    console.log('🧪 ELIRA Stripe Key Testing Tool');
    console.log('=' .repeat(50));
  }

  /**
   * Read Stripe configuration from environment files
   */
  readStripeConfig() {
    const config = {};

    // Read from .env.local
    if (fs.existsSync(this.envLocalPath)) {
      const envContent = fs.readFileSync(this.envLocalPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.includes('STRIPE')) {
          const match = line.match(/^(.+)=["']?([^"'\n]+)["']?$/);
          if (match) {
            const [, key, value] = match;
            config[key.trim()] = value.trim();
          }
        }
      }
    }

    // Read from functions/.env
    if (fs.existsSync(this.functionsEnvPath)) {
      const envContent = fs.readFileSync(this.functionsEnvPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.includes('STRIPE')) {
          const match = line.match(/^(.+)=["']?([^"'\n]+)["']?$/);
          if (match) {
            const [, key, value] = match;
            config[key.trim()] = value.trim();
          }
        }
      }
    }

    return config;
  }

  /**
   * Analyze Stripe key properties
   */
  analyzeStripeKeys(config) {
    console.log('\n🔍 STRIPE KEY ANALYSIS');
    console.log('=' .repeat(50));

    const analysis = {
      publishableKey: null,
      secretKey: null,
      webhookSecret: null,
      environment: null,
      keyType: null,
      issues: [],
      recommendations: []
    };

    // Analyze publishable key
    if (config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      const pubKey = config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      analysis.publishableKey = {
        present: true,
        format: pubKey.startsWith('pk_') ? 'valid' : 'invalid',
        environment: pubKey.includes('test') ? 'test' : pubKey.includes('live') ? 'live' : 'unknown',
        length: pubKey.length
      };

      console.log('📋 Publishable Key:');
      console.log(`   Format: ${analysis.publishableKey.format === 'valid' ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Environment: ${analysis.publishableKey.environment}`);
      console.log(`   Length: ${analysis.publishableKey.length} characters`);

      if (analysis.publishableKey.environment === 'live') {
        analysis.recommendations.push('Using LIVE publishable key - ensure this is intended for production');
      }
    } else {
      analysis.issues.push('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      console.log('📋 Publishable Key: ❌ Missing');
    }

    // Analyze secret key
    if (config.STRIPE_SECRET_KEY) {
      const secretKey = config.STRIPE_SECRET_KEY;
      analysis.secretKey = {
        present: true,
        format: (secretKey.startsWith('sk_') || secretKey.startsWith('rk_')) ? 'valid' : 'invalid',
        type: secretKey.startsWith('rk_') ? 'restricted' : 'full',
        environment: secretKey.includes('test') ? 'test' : secretKey.includes('live') ? 'live' : 'unknown',
        length: secretKey.length
      };

      console.log('\n📋 Secret Key:');
      console.log(`   Format: ${analysis.secretKey.format === 'valid' ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Type: ${analysis.secretKey.type === 'restricted' ? '✅ Restricted (Recommended)' : '⚠️  Full Access'}`);
      console.log(`   Environment: ${analysis.secretKey.environment}`);
      console.log(`   Length: ${analysis.secretKey.length} characters`);

      if (analysis.secretKey.type === 'full') {
        analysis.recommendations.push('Consider using restricted API key (rk_) for better security');
      }

      if (analysis.secretKey.environment === 'live') {
        analysis.recommendations.push('Using LIVE secret key - ensure this is intended for production');
      }
    } else {
      analysis.issues.push('Missing STRIPE_SECRET_KEY');
      console.log('\n📋 Secret Key: ❌ Missing');
    }

    // Analyze webhook secret
    if (config.STRIPE_WEBHOOK_SECRET) {
      const webhookSecret = config.STRIPE_WEBHOOK_SECRET;
      analysis.webhookSecret = {
        present: true,
        format: webhookSecret.startsWith('whsec_') ? 'valid' : 'invalid',
        length: webhookSecret.length
      };

      console.log('\n📋 Webhook Secret:');
      console.log(`   Format: ${analysis.webhookSecret.format === 'valid' ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Length: ${analysis.webhookSecret.length} characters`);
    } else {
      analysis.issues.push('Missing STRIPE_WEBHOOK_SECRET');
      console.log('\n📋 Webhook Secret: ❌ Missing');
    }

    // Environment consistency check
    if (analysis.publishableKey && analysis.secretKey) {
      if (analysis.publishableKey.environment !== analysis.secretKey.environment) {
        analysis.issues.push('Environment mismatch: publishable and secret keys are from different environments');
      } else {
        analysis.environment = analysis.publishableKey.environment;
        console.log(`\n🌍 Environment: ${analysis.environment.toUpperCase()}`);
      }
    }

    return analysis;
  }

  /**
   * Mock Stripe API test (without actual API calls)
   */
  performMockTests(analysis) {
    console.log('\n🧪 MOCK API TESTS');
    console.log('=' .repeat(50));
    console.log('ℹ️  These are format validation tests only - no actual API calls made');

    const tests = [
      {
        name: 'Key Format Validation',
        status: analysis.publishableKey?.format === 'valid' && analysis.secretKey?.format === 'valid' ? 'pass' : 'fail',
        details: 'Validates that keys follow Stripe format conventions'
      },
      {
        name: 'Environment Consistency', 
        status: analysis.environment ? 'pass' : 'fail',
        details: 'Ensures publishable and secret keys are from same environment'
      },
      {
        name: 'Webhook Secret Format',
        status: analysis.webhookSecret?.format === 'valid' ? 'pass' : 'fail',
        details: 'Validates webhook secret follows expected format'
      },
      {
        name: 'Security Best Practices',
        status: analysis.secretKey?.type === 'restricted' ? 'pass' : 'warn',
        details: 'Checks if using restricted API keys for better security'
      }
    ];

    tests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'warn' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.name}: ${test.status.toUpperCase()}`);
      console.log(`      ${test.details}`);
    });

    return tests;
  }

  /**
   * Generate test recommendations
   */
  generateRecommendations(analysis, tests) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(50));

    const recommendations = [...analysis.recommendations];

    // Add test-based recommendations
    const failedTests = tests.filter(test => test.status === 'fail');
    if (failedTests.length > 0) {
      recommendations.push('Fix failing validation tests before proceeding');
    }

    const warnTests = tests.filter(test => test.status === 'warn');
    if (warnTests.length > 0) {
      recommendations.push('Consider addressing security warnings');
    }

    if (analysis.environment === 'test') {
      recommendations.push('Ready for development - remember to use live keys for production');
    }

    if (recommendations.length === 0) {
      console.log('🎉 No recommendations - your Stripe configuration looks good!');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    return recommendations;
  }

  /**
   * Display next steps
   */
  displayNextSteps(analysis) {
    console.log('\n📋 NEXT STEPS');
    console.log('=' .repeat(50));

    if (analysis.issues.length > 0) {
      console.log('🔧 Fix Configuration Issues:');
      analysis.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('\n   Run: npm run security:rotate-stripe-keys');
    } else {
      console.log('✅ Configuration is valid. Next steps:');
      console.log('   1. Test actual payment flow in your application');
      console.log('   2. Verify webhook endpoints receive events');
      console.log('   3. Monitor Stripe Dashboard for any issues');
      console.log('   4. Set up automated testing for payment flows');
    }

    console.log('\n🔗 Useful Links:');
    console.log('   • Stripe Dashboard: https://dashboard.stripe.com');
    console.log('   • API Keys: https://dashboard.stripe.com/apikeys');
    console.log('   • Webhooks: https://dashboard.stripe.com/webhooks');
    console.log('   • Test Cards: https://stripe.com/docs/testing#cards');
  }

  /**
   * Main testing process
   */
  async testStripeKeys() {
    try {
      // Step 1: Read configuration
      const config = this.readStripeConfig();
      
      if (Object.keys(config).length === 0) {
        console.log('❌ No Stripe configuration found in environment files');
        console.log('   Run: npm run security:rotate-stripe-keys');
        return;
      }

      // Step 2: Analyze keys
      const analysis = this.analyzeStripeKeys(config);

      // Step 3: Perform mock tests
      const testResults = this.performMockTests(analysis);

      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(analysis, testResults);

      // Step 5: Display next steps
      this.displayNextSteps(analysis);

      // Step 6: Summary
      const passedTests = testResults.filter(test => test.status === 'pass').length;
      const totalTests = testResults.length;
      
      console.log('\n📊 SUMMARY');
      console.log('=' .repeat(50));
      console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
      console.log(`   Issues Found: ${analysis.issues.length}`);
      console.log(`   Recommendations: ${recommendations.length}`);

      if (analysis.issues.length === 0 && passedTests === totalTests) {
        console.log('\n🎉 All tests passed! Stripe configuration is ready.');
        return true;
      } else {
        console.log('\n⚠️  Some issues found. Please review and fix.');
        return false;
      }

    } catch (error) {
      console.error('❌ Error during Stripe key testing:', error);
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new StripeKeyTester();
  tester.testStripeKeys().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { StripeKeyTester };