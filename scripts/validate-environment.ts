#!/usr/bin/env npx ts-node

/**
 * DMA Environment Validation Script
 * 
 * Validates all environment variables and configuration files
 * to ensure proper setup before deployment or development.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  successes: string[];
}

interface ServiceConfig {
  name: string;
  required: boolean;
  envVars: string[];
  description: string;
  testFunction?: () => boolean;
}

class EnvironmentValidator {
  private envLocalPath = '.env.local';
  private functionsEnvPath = 'functions/.env';
  private secureKeyPath = '../secure/dma-67ab7-firebase-adminsdk.json';

  private serviceConfigs: ServiceConfig[] = [
    {
      name: 'Firebase Client SDK',
      required: true,
      envVars: [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID'
      ],
      description: 'Firebase client-side configuration for frontend'
    },
    {
      name: 'Firebase Admin SDK',
      required: true,
      envVars: ['GOOGLE_APPLICATION_CREDENTIALS'],
      description: 'Firebase server-side admin SDK configuration',
      testFunction: () => fs.existsSync(this.secureKeyPath)
    },
    {
      name: 'SendGrid Email Service',
      required: true,
      envVars: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
      description: 'Email service for notifications and transactional emails'
    },
    {
      name: 'Stripe Payment Processing',
      required: true,
      envVars: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
      description: 'Payment processing for course purchases'
    },
    {
      name: 'Mux Video Processing',
      required: true,
      envVars: ['NEXT_PUBLIC_MUX_ENV_KEY', 'MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'],
      description: 'Video streaming and processing service'
    },
    {
      name: 'Security Configuration',
      required: true,
      envVars: ['JWT_SECRET', 'ENCRYPTION_KEY'],
      description: 'Security keys for authentication and encryption'
    }
  ];

  /**
   * Read environment variables from file
   */
  private readEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars: Record<string, string> = {};

    const lines = envContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#\s=]+)=["']?([^"'\n]+)["']?$/);
      if (match) {
        const [, key, value] = match;
        envVars[key.trim()] = value.trim();
      }
    }

    return envVars;
  }

  /**
   * Check if a value is a placeholder
   */
  private isPlaceholder(value: string): boolean {
    const placeholderPatterns = [
      'your-',
      'new-',
      'add-your-',
      'replace-with-',
      'todo-',
      'change-me',
      'placeholder',
      'example',
      'test-key-here',
      'api-key-here'
    ];

    return placeholderPatterns.some(pattern => 
      value.toLowerCase().includes(pattern)
    );
  }

  /**
   * Validate Firebase configuration format
   */
  private validateFirebaseConfig(envVars: Record<string, string>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
      successes: []
    };

    const apiKey = envVars['NEXT_PUBLIC_FIREBASE_API_KEY'];
    if (apiKey) {
      if (!apiKey.startsWith('AIza')) {
        result.issues.push('Firebase API key should start with "AIza"');
        result.valid = false;
      } else {
        result.successes.push('Firebase API key format valid');
      }
    }

    const authDomain = envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'];
    if (authDomain) {
      if (!authDomain.includes('.firebaseapp.com')) {
        result.issues.push('Firebase Auth domain should end with .firebaseapp.com');
        result.valid = false;
      } else {
        result.successes.push('Firebase Auth domain format valid');
      }
    }

    const appId = envVars['NEXT_PUBLIC_FIREBASE_APP_ID'];
    if (appId) {
      if (!appId.includes(':')) {
        result.issues.push('Firebase App ID should contain a colon (:)');
        result.valid = false;
      } else {
        result.successes.push('Firebase App ID format valid');
      }
    }

    return result;
  }

  /**
   * Validate Stripe configuration
   */
  private validateStripeConfig(envVars: Record<string, string>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
      successes: []
    };

    const publishableKey = envVars['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'];
    if (publishableKey) {
      if (!publishableKey.startsWith('pk_')) {
        result.issues.push('Stripe publishable key should start with "pk_"');
        result.valid = false;
      } else if (publishableKey.startsWith('pk_live_')) {
        result.warnings.push('Using Stripe LIVE keys in development - ensure this is intentional');
      } else {
        result.successes.push('Stripe publishable key format valid');
      }
    }

    const secretKey = envVars['STRIPE_SECRET_KEY'];
    if (secretKey) {
      if (!secretKey.startsWith('sk_')) {
        result.issues.push('Stripe secret key should start with "sk_"');
        result.valid = false;
      } else if (secretKey.startsWith('sk_live_')) {
        result.warnings.push('Using Stripe LIVE secret key in development - ensure this is intentional');
      } else {
        result.successes.push('Stripe secret key format valid');
      }
    }

    return result;
  }

  /**
   * Validate service configuration
   */
  private validateService(service: ServiceConfig, frontendEnv: Record<string, string>, backendEnv: Record<string, string>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
      successes: []
    };

    const allEnvVars = { ...frontendEnv, ...backendEnv };

    // Check required environment variables
    for (const envVar of service.envVars) {
      const value = allEnvVars[envVar];
      
      if (!value) {
        if (service.required) {
          result.issues.push(`Missing required environment variable: ${envVar}`);
          result.valid = false;
        } else {
          result.warnings.push(`Optional environment variable not set: ${envVar}`);
        }
        continue;
      }

      // Check for placeholder values
      if (this.isPlaceholder(value)) {
        result.issues.push(`Placeholder value detected for ${envVar}: ${value}`);
        result.valid = false;
        continue;
      }

      result.successes.push(`${envVar} configured`);
    }

    // Run custom test function if provided
    if (service.testFunction && !service.testFunction()) {
      result.issues.push(`Custom validation failed for ${service.name}`);
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate all environment configuration
   */
  public validateEnvironment(): ValidationResult {
    console.log('🔍 DMA Environment Validation');
    console.log('=' .repeat(50));

    const overallResult: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
      successes: []
    };

    // Read environment files
    const frontendEnv = this.readEnvFile(this.envLocalPath);
    const backendEnv = this.readEnvFile(this.functionsEnvPath);

    console.log(`\n📋 Found ${Object.keys(frontendEnv).length} frontend environment variables`);
    console.log(`📋 Found ${Object.keys(backendEnv).length} backend environment variables`);

    // Validate each service
    for (const service of this.serviceConfigs) {
      console.log(`\n🔧 Validating ${service.name}...`);
      
      const serviceResult = this.validateService(service, frontendEnv, backendEnv);
      
      // Merge results
      overallResult.issues.push(...serviceResult.issues);
      overallResult.warnings.push(...serviceResult.warnings);
      overallResult.successes.push(...serviceResult.successes);
      
      if (!serviceResult.valid) {
        overallResult.valid = false;
      }

      // Show service-specific results
      if (serviceResult.successes.length > 0) {
        serviceResult.successes.forEach(success => {
          console.log(`  ✅ ${success}`);
        });
      }
      
      if (serviceResult.warnings.length > 0) {
        serviceResult.warnings.forEach(warning => {
          console.log(`  ⚠️  ${warning}`);
        });
      }
      
      if (serviceResult.issues.length > 0) {
        serviceResult.issues.forEach(issue => {
          console.log(`  ❌ ${issue}`);
        });
      }
    }

    // Special validations
    const firebaseValidation = this.validateFirebaseConfig(frontendEnv);
    overallResult.issues.push(...firebaseValidation.issues);
    overallResult.warnings.push(...firebaseValidation.warnings);
    overallResult.successes.push(...firebaseValidation.successes);
    if (!firebaseValidation.valid) overallResult.valid = false;

    const stripeValidation = this.validateStripeConfig({ ...frontendEnv, ...backendEnv });
    overallResult.issues.push(...stripeValidation.issues);
    overallResult.warnings.push(...stripeValidation.warnings);
    overallResult.successes.push(...stripeValidation.successes);
    if (!stripeValidation.valid) overallResult.valid = false;

    return overallResult;
  }

  /**
   * Print validation results
   */
  public printResults(result: ValidationResult): void {
    console.log('\n🎯 VALIDATION RESULTS');
    console.log('=' .repeat(50));

    if (result.successes.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      result.successes.forEach(success => {
        console.log(`  ✅ ${success}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      result.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }

    if (result.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      result.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    }

    console.log('\n📊 SUMMARY:');
    console.log(`  ✅ Passed: ${result.successes.length}`);
    console.log(`  ⚠️  Warnings: ${result.warnings.length}`);
    console.log(`  ❌ Critical: ${result.issues.length}`);

    if (result.valid) {
      console.log('\n🎉 Environment validation passed! Ready for development/deployment.');
    } else {
      console.log('\n🚨 Environment validation failed! Please fix critical issues before proceeding.');
    }
  }
}

// Export for testing
export { EnvironmentValidator };

// Run if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  const result = validator.validateEnvironment();
  validator.printResults(result);
  
  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1);
}