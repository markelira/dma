#!/usr/bin/env node

/**
 * DMA Stripe Key Rotation Script
 * 
 * This script helps rotate Stripe API keys following security best practices
 * with restricted permissions and proper webhook secret management.
 * 
 * Usage: node scripts/rotate-stripe-keys.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

class StripeKeyRotator {
  constructor() {
    this.envLocalPath = '.env.local';
    this.functionsEnvPath = 'functions/.env';
    this.secureBackupsPath = '../secure/backups';
    
    console.log('💳 DMA Stripe Key Rotation Tool');
    console.log('=' .repeat(50));
  }

  /**
   * Create secure backup of current configuration
   */
  createSecureBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (!fs.existsSync(this.secureBackupsPath)) {
      fs.mkdirSync(this.secureBackupsPath, { recursive: true });
    }

    // Backup current env files
    if (fs.existsSync(this.envLocalPath)) {
      const backupPath = path.join(this.secureBackupsPath, `stripe.env.local.${timestamp}.backup`);
      fs.copyFileSync(this.envLocalPath, backupPath);
      console.log(`📁 Backed up .env.local to: ${backupPath}`);
    }

    if (fs.existsSync(this.functionsEnvPath)) {
      const backupPath = path.join(this.secureBackupsPath, `stripe.functions.env.${timestamp}.backup`);
      fs.copyFileSync(this.functionsEnvPath, backupPath);
      console.log(`📁 Backed up functions/.env to: ${backupPath}`);
    }
  }

  /**
   * Read current Stripe configuration
   */
  readCurrentStripeConfig() {
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
   * Validate Stripe key formats
   */
  validateStripeKeys(config) {
    const issues = [];
    const warnings = [];

    // Validate publishable key
    if (config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      const pubKey = config.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!pubKey.startsWith('pk_')) {
        issues.push('Publishable key must start with "pk_"');
      } else if (pubKey.startsWith('pk_live_')) {
        warnings.push('Using LIVE publishable key - ensure this is intentional for production');
      } else if (pubKey.startsWith('pk_test_')) {
        console.log('✅ Using TEST publishable key (recommended for development)');
      }
    } else {
      issues.push('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    }

    // Validate secret key
    if (config.STRIPE_SECRET_KEY) {
      const secretKey = config.STRIPE_SECRET_KEY;
      if (!secretKey.startsWith('sk_') && !secretKey.startsWith('rk_')) {
        issues.push('Secret key must start with "sk_" (full access) or "rk_" (restricted)');
      } else if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) {
        warnings.push('Using LIVE secret key - ensure this is intentional for production');
      } else if (secretKey.startsWith('rk_')) {
        console.log('✅ Using RESTRICTED secret key (recommended for security)');
      }
    } else {
      issues.push('Missing STRIPE_SECRET_KEY');
    }

    // Validate webhook secret
    if (config.STRIPE_WEBHOOK_SECRET) {
      const webhookSecret = config.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret.startsWith('whsec_')) {
        issues.push('Webhook secret must start with "whsec_"');
      }
    } else {
      issues.push('Missing STRIPE_WEBHOOK_SECRET');
    }

    // Check for placeholder values
    Object.entries(config).forEach(([key, value]) => {
      if (value.includes('your-') || value.includes('new-') || value.includes('test-key-here')) {
        issues.push(`Placeholder value detected for ${key}`);
      }
    });

    return { issues, warnings };
  }

  /**
   * Display Stripe setup instructions
   */
  displayStripeInstructions() {
    console.log('\n📋 STRIPE SETUP INSTRUCTIONS');
    console.log('=' .repeat(50));
    console.log('\n🔗 Go to: https://dashboard.stripe.com/apikeys');
    console.log('\n📝 Create New Restricted API Key with these permissions:');
    console.log('   ✅ Charges: Write');
    console.log('   ✅ Customers: Read/Write');
    console.log('   ✅ Payment Intents: Read/Write');
    console.log('   ✅ Checkout Sessions: Read/Write');
    console.log('   ✅ Webhooks: Read');
    console.log('   ✅ Products: Read (for subscription management)');
    console.log('   ✅ Prices: Read (for subscription management)');
    
    console.log('\n🔗 For webhooks, go to: https://dashboard.stripe.com/webhooks');
    console.log('📝 Create endpoint: https://your-domain.com/api/stripe/webhook');
    console.log('📝 Select these events:');
    console.log('   ✅ checkout.session.completed');
    console.log('   ✅ payment_intent.succeeded'); 
    console.log('   ✅ customer.subscription.created');
    console.log('   ✅ customer.subscription.updated');
    console.log('   ✅ customer.subscription.deleted');
    console.log('   ✅ invoice.payment_succeeded');
    console.log('   ✅ invoice.payment_failed');
  }

  /**
   * Interactive configuration collection
   */
  async collectStripeConfiguration() {
    this.displayStripeInstructions();
    
    console.log('\n📋 Please provide your Stripe configuration:');
    
    const config = {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: await askQuestion('\nPublishable Key (pk_test_... or pk_live_...): '),
      STRIPE_SECRET_KEY: await askQuestion('Secret Key (sk_test_... or rk_test_... [recommended restricted]): '),
      STRIPE_WEBHOOK_SECRET: await askQuestion('Webhook Secret (whsec_...): ')
    };

    // Optional additional configuration
    const priceIds = await askQuestion('\nDo you want to configure Price IDs? (y/N): ');
    if (priceIds.toLowerCase() === 'y') {
      config.STRIPE_PRICE_COURSE_BASIC = await askQuestion('Basic Course Price ID (price_...): ');
      config.STRIPE_PRICE_COURSE_PREMIUM = await askQuestion('Premium Course Price ID (price_...): ');
      config.STRIPE_PRICE_SUBSCRIPTION_MONTHLY = await askQuestion('Monthly Subscription Price ID (price_...): ');
    }

    return config;
  }

  /**
   * Update environment files with new Stripe configuration
   */
  updateEnvironmentFiles(stripeConfig) {
    // Update .env.local
    if (fs.existsSync(this.envLocalPath)) {
      let envContent = fs.readFileSync(this.envLocalPath, 'utf8');
      
      // Update or add Stripe publishable key
      if (envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=".+"/,
          `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${stripeConfig.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"`
        );
      } else {
        envContent += `\n# Stripe Configuration\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${stripeConfig.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"\n`;
      }

      fs.writeFileSync(this.envLocalPath, envContent);
      console.log(`✅ Updated ${this.envLocalPath} with new publishable key`);
    }

    // Update functions/.env
    if (fs.existsSync(this.functionsEnvPath)) {
      let functionsEnvContent = fs.readFileSync(this.functionsEnvPath, 'utf8');
      
      // Update secret key
      if (functionsEnvContent.includes('STRIPE_SECRET_KEY')) {
        functionsEnvContent = functionsEnvContent.replace(
          /STRIPE_SECRET_KEY=".+"/,
          `STRIPE_SECRET_KEY="${stripeConfig.STRIPE_SECRET_KEY}"`
        );
      } else {
        functionsEnvContent += `\n# Stripe Secret Configuration\nSTRIPE_SECRET_KEY="${stripeConfig.STRIPE_SECRET_KEY}"\n`;
      }

      // Update webhook secret
      if (functionsEnvContent.includes('STRIPE_WEBHOOK_SECRET')) {
        functionsEnvContent = functionsEnvContent.replace(
          /STRIPE_WEBHOOK_SECRET=".+"/,
          `STRIPE_WEBHOOK_SECRET="${stripeConfig.STRIPE_WEBHOOK_SECRET}"`
        );
      } else {
        functionsEnvContent += `STRIPE_WEBHOOK_SECRET="${stripeConfig.STRIPE_WEBHOOK_SECRET}"\n`;
      }

      // Add optional price IDs
      if (stripeConfig.STRIPE_PRICE_COURSE_BASIC) {
        if (functionsEnvContent.includes('STRIPE_PRICE_COURSE_BASIC')) {
          functionsEnvContent = functionsEnvContent.replace(
            /STRIPE_PRICE_COURSE_BASIC=".+"/,
            `STRIPE_PRICE_COURSE_BASIC="${stripeConfig.STRIPE_PRICE_COURSE_BASIC}"`
          );
        } else {
          functionsEnvContent += `STRIPE_PRICE_COURSE_BASIC="${stripeConfig.STRIPE_PRICE_COURSE_BASIC}"\n`;
        }
      }

      if (stripeConfig.STRIPE_PRICE_COURSE_PREMIUM) {
        if (functionsEnvContent.includes('STRIPE_PRICE_COURSE_PREMIUM')) {
          functionsEnvContent = functionsEnvContent.replace(
            /STRIPE_PRICE_COURSE_PREMIUM=".+"/,
            `STRIPE_PRICE_COURSE_PREMIUM="${stripeConfig.STRIPE_PRICE_COURSE_PREMIUM}"`
          );
        } else {
          functionsEnvContent += `STRIPE_PRICE_COURSE_PREMIUM="${stripeConfig.STRIPE_PRICE_COURSE_PREMIUM}"\n`;
        }
      }

      if (stripeConfig.STRIPE_PRICE_SUBSCRIPTION_MONTHLY) {
        if (functionsEnvContent.includes('STRIPE_PRICE_SUBSCRIPTION_MONTHLY')) {
          functionsEnvContent = functionsEnvContent.replace(
            /STRIPE_PRICE_SUBSCRIPTION_MONTHLY=".+"/,
            `STRIPE_PRICE_SUBSCRIPTION_MONTHLY="${stripeConfig.STRIPE_PRICE_SUBSCRIPTION_MONTHLY}"`
          );
        } else {
          functionsEnvContent += `STRIPE_PRICE_SUBSCRIPTION_MONTHLY="${stripeConfig.STRIPE_PRICE_SUBSCRIPTION_MONTHLY}"\n`;
        }
      }

      fs.writeFileSync(this.functionsEnvPath, functionsEnvContent);
      console.log(`✅ Updated ${this.functionsEnvPath} with new secret keys`);
    }
  }

  /**
   * Generate Firebase Functions configuration commands
   */
  generateFirebaseCommands(stripeConfig) {
    console.log('\n🔥 Firebase Functions Configuration Commands:');
    console.log('=' .repeat(50));
    console.log('Run these commands to set Stripe configuration in Firebase Functions:');
    console.log('');
    console.log(`firebase functions:config:set stripe.secret_key="${stripeConfig.STRIPE_SECRET_KEY}"`);
    console.log(`firebase functions:config:set stripe.webhook_secret="${stripeConfig.STRIPE_WEBHOOK_SECRET}"`);
    
    if (stripeConfig.STRIPE_PRICE_COURSE_BASIC) {
      console.log(`firebase functions:config:set stripe.price_course_basic="${stripeConfig.STRIPE_PRICE_COURSE_BASIC}"`);
    }
    
    if (stripeConfig.STRIPE_PRICE_COURSE_PREMIUM) {
      console.log(`firebase functions:config:set stripe.price_course_premium="${stripeConfig.STRIPE_PRICE_COURSE_PREMIUM}"`);
    }

    if (stripeConfig.STRIPE_PRICE_SUBSCRIPTION_MONTHLY) {
      console.log(`firebase functions:config:set stripe.price_subscription_monthly="${stripeConfig.STRIPE_PRICE_SUBSCRIPTION_MONTHLY}"`);
    }

    console.log('\nThen deploy with: firebase deploy --only functions');
  }

  /**
   * Run validation after update
   */
  runValidation() {
    try {
      const { execSync } = require('child_process');
      console.log('\n🔍 Running security validation...');
      execSync('npm run security:validate-env', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Security validation failed. Please check configuration manually.');
    }
  }

  /**
   * Display security reminders
   */
  displaySecurityReminders() {
    console.log('\n🛡️  SECURITY REMINDERS');
    console.log('=' .repeat(50));
    console.log('📋 After rotating keys:');
    console.log('   1. ❗ IMMEDIATELY revoke old keys in Stripe Dashboard');
    console.log('   2. ✅ Test payment flows in your application');
    console.log('   3. ✅ Verify webhook endpoints are receiving events');
    console.log('   4. ✅ Update any CI/CD environments with new keys');
    console.log('   5. ✅ Monitor Stripe Dashboard for any issues');
    console.log('');
    console.log('⚠️  For production:');
    console.log('   - Use live keys (pk_live_, sk_live_/rk_live_)');
    console.log('   - Set up monitoring and alerting');
    console.log('   - Regular key rotation (quarterly recommended)');
    console.log('   - Review restricted key permissions periodically');
  }

  /**
   * Main rotation process
   */
  async rotateStripeKeys() {
    try {
      console.log('🔄 Starting Stripe key rotation process...\n');

      // Step 1: Read current configuration
      const currentConfig = this.readCurrentStripeConfig();
      console.log('📖 Current Stripe configuration:');
      Object.keys(currentConfig).forEach(key => {
        const value = currentConfig[key];
        const maskedValue = value ? value.substring(0, 12) + '...' : 'Not set';
        console.log(`   ${key}: ${maskedValue}`);
      });

      // Step 2: Create backup
      console.log('\n📁 Creating secure backup...');
      this.createSecureBackup();

      // Step 3: Collect new configuration
      const newStripeConfig = await this.collectStripeConfiguration();

      // Step 4: Validate configuration
      console.log('\n🔍 Validating new Stripe configuration...');
      const validation = this.validateStripeKeys(newStripeConfig);
      
      if (validation.issues.length > 0) {
        console.log('❌ Configuration validation failed:');
        validation.issues.forEach(issue => console.log(`   - ${issue}`));
        rl.close();
        return;
      }

      if (validation.warnings.length > 0) {
        console.log('⚠️  Configuration warnings:');
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

      console.log('✅ Configuration validation passed');

      // Step 5: Confirm before writing
      const confirm = await askQuestion('\n❓ Update configuration with new Stripe keys? (y/N): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Operation cancelled');
        rl.close();
        return;
      }

      // Step 6: Update configuration files
      console.log('\n📝 Updating environment files...');
      this.updateEnvironmentFiles(newStripeConfig);

      // Step 7: Generate Firebase commands
      this.generateFirebaseCommands(newStripeConfig);

      // Step 8: Run validation
      this.runValidation();

      // Step 9: Display security reminders
      this.displaySecurityReminders();

      console.log('\n🎉 Stripe key rotation completed successfully!');

    } catch (error) {
      console.error('❌ Error during Stripe key rotation:', error);
      console.log('\n🔄 Backups are available in:', this.secureBackupsPath);
    } finally {
      rl.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const rotator = new StripeKeyRotator();
  rotator.rotateStripeKeys();
}

module.exports = { StripeKeyRotator };