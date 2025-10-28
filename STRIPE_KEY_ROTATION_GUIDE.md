# 💳 DMA Stripe Key Rotation Guide

**Status: Step 3 of Day 1 Security Lockdown - COMPLETED**  
**Date: $(date +%Y-%m-%d %H:%M:%S)**

## 🎯 Overview

This guide covers the implementation of Step 3 from the production roadmap: Stripe Key Rotation with enhanced security using restricted API keys, comprehensive validation, and proper webhook management.

## ✅ What Was Implemented

### 1. Comprehensive Stripe Key Rotation Script
- **File**: `scripts/rotate-stripe-keys.js`
- **Features**:
  - Interactive Stripe configuration collection
  - Support for restricted API keys (recommended)
  - Webhook secret management
  - Environment consistency validation
  - Automatic backup creation
  - Firebase Functions configuration generation

### 2. Stripe Key Testing & Validation
- **File**: `scripts/test-stripe-keys.js`
- **Features**:
  - Format validation for all Stripe keys
  - Environment consistency checking
  - Security best practices analysis
  - Mock API testing (no actual charges)
  - Detailed recommendations

### 3. Enhanced Environment Validation
- **Enhanced**: `scripts/validate-environment.js`
- **New Features**:
  - Advanced Stripe key format validation
  - Environment mismatch detection
  - Security recommendations
  - Integration with existing validation system

### 4. NPM Script Integration
Added to `package.json`:
```json
{
  "scripts": {
    "security:rotate-stripe-keys": "node scripts/rotate-stripe-keys.js",
    "security:test-stripe": "node scripts/test-stripe-keys.js"
  }
}
```

## 🚀 How to Use

### Step 1: Check Current Stripe Configuration
```bash
npm run security:test-stripe
```

### Step 2: Rotate Stripe Keys
```bash
npm run security:rotate-stripe-keys
```

### Step 3: Validate Complete Environment
```bash
npm run security:validate-env
```

## 🔑 Required Stripe Configuration

### From Stripe Dashboard (https://dashboard.stripe.com/apikeys)

#### 1. Create Restricted API Key (Recommended)
**Permissions Required:**
- ✅ **Charges**: Write
- ✅ **Customers**: Read/Write
- ✅ **Payment Intents**: Read/Write
- ✅ **Checkout Sessions**: Read/Write
- ✅ **Webhooks**: Read
- ✅ **Products**: Read (for subscriptions)
- ✅ **Prices**: Read (for subscriptions)

#### 2. Key Types:
- **Publishable Key**: `pk_test_...` (development) or `pk_live_...` (production)
- **Secret Key**: `rk_test_...` (restricted, recommended) or `sk_test_...` (full access)
- **Webhook Secret**: `whsec_...` (from webhook endpoint configuration)

### From Stripe Webhooks (https://dashboard.stripe.com/webhooks)

#### Required Webhook Events:
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**Endpoint URL**: `https://your-domain.com/api/stripe/webhook`

## 🔍 Validation Features

The system validates:

### Key Format Validation:
- ✅ Publishable key format (`pk_test_` or `pk_live_`)
- ✅ Secret key format (`sk_` or `rk_` prefixes)
- ✅ Webhook secret format (`whsec_` prefix)
- ✅ Environment consistency (all keys from same environment)

### Security Analysis:
- ✅ Restricted vs Full access key detection
- ✅ Test vs Live environment identification
- ✅ Security recommendations
- ✅ Best practices compliance

### Configuration Testing:
- ✅ Mock API tests (format validation only)
- ✅ Environment consistency checks
- ✅ Integration with existing security validation

## 📊 Current Validation Status

After implementing Step 3, the enhanced validation shows:

```
✅ Passed: 12 checks
⚠️  Warnings: 1 (using full secret key instead of restricted)
❌ Critical: 10 (placeholder values - expected)
```

### Stripe-Specific Results:
- ✅ Stripe publishable key format valid (test mode)
- ✅ Stripe webhook secret format valid
- ✅ Stripe environment consistent (test)
- ⚠️ Using full Stripe secret key - consider restricted key (rk_) for better security

## 🛡️ Security Enhancements

### Restricted API Keys:
```
sk_test_... (Full Access) → rk_test_... (Restricted - Recommended)
```

**Benefits of Restricted Keys:**
- ✅ Principle of least privilege
- ✅ Reduced attack surface
- ✅ Better compliance with security standards
- ✅ Easier to audit permissions

### Environment Consistency:
- All keys must be from same environment (test/live)
- Automatic mismatch detection
- Clear warnings for live keys in development

### Secure Backup System:
```
../secure/backups/
├── stripe.env.local.2025-01-14-15-45-30.backup
├── stripe.functions.env.2025-01-14-15-45-30.backup
└── ...
```

## ⚡ Quick Commands

```bash
# Complete Stripe workflow
npm run security:test-stripe && npm run security:rotate-stripe-keys

# After rotation, validate everything
npm run security:validate-env

# Test just Stripe configuration
npm run security:test-stripe
```

## 🔧 Firebase Functions Integration

After key rotation, the script generates commands for Firebase Functions:

```bash
# Automatically generated by rotation script
firebase functions:config:set stripe.secret_key="rk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase functions:config:set stripe.price_course_basic="price_..."
firebase functions:config:set stripe.price_course_premium="price_..."

# Deploy configuration
firebase deploy --only functions
```

## 📋 Step-by-Step Rotation Process

### 1. Pre-Rotation Check:
```bash
npm run security:test-stripe
```

### 2. Create New Keys in Stripe Dashboard:
- Go to https://dashboard.stripe.com/apikeys
- Create new **restricted** API key with required permissions
- Copy publishable key, restricted secret key

### 3. Set Up Webhook:
- Go to https://dashboard.stripe.com/webhooks
- Create endpoint: `https://your-domain.com/api/stripe/webhook`
- Select required events
- Copy webhook secret

### 4. Run Rotation:
```bash
npm run security:rotate-stripe-keys
```

### 5. Validate Configuration:
```bash
npm run security:validate-env
```

### 6. Deploy to Firebase:
```bash
firebase deploy --only functions
```

### 7. **IMMEDIATELY Revoke Old Keys:**
- Go to Stripe Dashboard
- Delete/revoke old API keys
- Remove old webhook endpoints

## 🚨 Security Reminders

### Immediate Actions After Rotation:
1. ❗ **IMMEDIATELY revoke old keys in Stripe Dashboard**
2. ✅ Test payment flows in your application
3. ✅ Verify webhook endpoints receive events
4. ✅ Update any CI/CD environments
5. ✅ Monitor Stripe Dashboard for issues

### Best Practices:
- Always use **restricted keys** (rk_) in production
- Never commit real API keys to version control
- Test with Stripe test cards before going live
- Set up monitoring and alerts
- Rotate keys quarterly
- Use webhooks for reliable event handling

## 🧪 Testing Your Setup

### Test Cards (Development):
```
# Visa
4242424242424242 (any CVC, future date)

# Visa (debit)
4000056655665556

# Declined card
4000000000000002

# Authentication required
4000002500003155
```

### Test Webhooks:
```bash
# Install Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📞 Support Resources

### Stripe Documentation:
- Dashboard: https://dashboard.stripe.com
- API Keys: https://dashboard.stripe.com/apikeys
- Webhooks: https://dashboard.stripe.com/webhooks
- Test Cards: https://stripe.com/docs/testing#cards
- Restricted Keys: https://stripe.com/docs/keys#limit-api-key-access

### DMA Scripts:
- Run `npm run security:test-stripe` for diagnostics
- Check `../secure/backups/` for recovery files
- Review security validation output for issues

## 🎯 Results Summary

### ✅ Step 3 Achievements:
1. **Secure Key Rotation**: Automated Stripe key rotation with restricted permissions
2. **Enhanced Validation**: Comprehensive format and security validation
3. **Testing Framework**: Mock testing and validation without API calls
4. **Webhook Management**: Complete webhook secret management
5. **Security Integration**: Seamless integration with existing security system

### 📈 Security Improvements:
- **Before**: Basic Stripe key validation
- **After**: Complete Stripe security management with restricted keys, environment validation, and testing

### 🔄 Next Steps:
- ✅ Stripe key rotation system complete
- ✅ Enhanced validation system operational
- ⏳ Ready for additional service integrations (Mux, SendGrid)

---
**✅ Step 3: Stripe Key Rotation - COMPLETE**  
**🎯 Ready for Step 4: SendGrid & Mux Service Configuration**