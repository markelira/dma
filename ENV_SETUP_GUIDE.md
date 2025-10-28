# Environment Variables Setup Guide

This guide explains how to set up environment variables for both the frontend and backend of the DMA platform.

## 📋 Overview

The DMA platform uses environment variables to configure various services:
- **Firebase** - Authentication, database, storage
- **Stripe** - Payment processing
- **SendGrid** - Email delivery
- **Mux** - Video hosting and streaming
- **Sentry** - Error tracking
- **Discord** - Notifications (optional)

## 🚀 Quick Start

### 1. Frontend Setup (Main Project)

```bash
# Navigate to project root
cd /Users/marquese/elira-main

# Copy the template
cp .env.local.template .env.local

# Edit with your values
# (Use your preferred editor)
```

### 2. Backend Setup (Firebase Functions - Main)

```bash
# Navigate to functions folder
cd /Users/marquese/elira-main/functions

# Copy the template
cp .env.template .env

# Edit with your values
```

### 3. Landing Site Setup (if using dma-landing)

```bash
# Frontend
cd /Users/marquese/elira-main/dma-landing
cp .env.local.template .env.local

# Backend Functions
cd /Users/marquese/elira-main/dma-landing/functions
cp .env.template .env
```

## 🔑 Getting Your API Keys

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **For Frontend (Client SDK):**
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the Firebase config object values
4. **For Backend (Admin SDK):**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Copy values from downloaded JSON file

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **API Keys:**
   - Navigate to Developers > API keys
   - Copy "Publishable key" (for frontend)
   - Copy "Secret key" (for backend)
   - Use test keys for development (pk_test_... / sk_test_...)
3. **Webhook Secret:**
   - Navigate to Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhook/stripe`
   - Copy the "Signing secret"

### SendGrid
1. Go to [SendGrid](https://app.sendgrid.com/)
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Give it "Full Access" or "Mail Send" permissions
5. Copy the generated key (starts with SG.)
6. **Verify sender email:**
   - Settings > Sender Authentication
   - Verify a single sender email

### Mux
1. Go to [Mux Dashboard](https://dashboard.mux.com/)
2. **API Access Token:**
   - Settings > Access Tokens
   - Create new token with "Mux Video" permissions
   - Copy Token ID and Token Secret
3. **Signing Keys (Optional):**
   - Settings > Signing Keys
   - Generate new key
   - Copy Signing Key ID and Private Key
4. **Webhook Secret:**
   - Settings > Webhooks
   - Add webhook endpoint
   - Copy signing secret

### Sentry (Error Tracking - Optional)
1. Go to [Sentry.io](https://sentry.io/)
2. Create/select project
3. Copy the DSN from Project Settings > Client Keys (DSN)
4. Create Auth Token in Settings > Developer Settings > Auth Tokens

### Discord (Notifications - Optional)
1. Go to your Discord server
2. Server Settings > Integrations > Webhooks
3. Create webhook
4. Copy the webhook URL

## 📝 Environment Variable Details

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ Yes | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ Yes | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ⚠️ Optional | Google Analytics measurement ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | Stripe publishable key (pk_test_... or pk_live_...) |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Your app URL (e.g., http://localhost:3000) |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | ⚠️ Dev only | Set to 'true' for local emulators |
| `NEXT_PUBLIC_SENTRY_DSN` | ⚠️ Optional | Sentry error tracking DSN |

### Backend Functions (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | ✅ Yes | Firebase project ID (from service account JSON) |
| `FIREBASE_CLIENT_EMAIL` | ✅ Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ Yes | Service account private key (keep quotes and \n) |
| `STRIPE_SECRET_KEY` | ✅ Yes | Stripe secret key (sk_test_... or sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Stripe webhook signing secret |
| `SENDGRID_API_KEY` | ✅ Yes | SendGrid API key (starts with SG.) |
| `SENDGRID_FROM_EMAIL` | ✅ Yes | Verified sender email in SendGrid |
| `MUX_TOKEN_ID` | ✅ Yes | Mux API token ID |
| `MUX_TOKEN_SECRET` | ✅ Yes | Mux API token secret |
| `MUX_SIGNING_KEY` | ⚠️ Optional | For signed video URLs |
| `MUX_SIGNING_KEY_ID` | ⚠️ Optional | Signing key ID |
| `APP_URL` | ✅ Yes | Your app URL for emails/redirects |
| `DISCORD_WEBHOOK_URL` | ⚠️ Optional | Discord webhook for notifications |

## 🔒 Security Best Practices

1. **Never commit .env files to git**
   - They're already in .gitignore
   - Only commit .template files

2. **Use different keys for development and production**
   - Test keys for development (sk_test_...)
   - Live keys for production (sk_live_...)

3. **Rotate keys regularly**
   - Especially if exposed or compromised
   - Use strong API keys

4. **Protect private keys**
   - Never expose Firebase Admin SDK private keys
   - Keep backend .env files secure

## 🧪 Testing Your Setup

### Frontend Test
```bash
cd /Users/marquese/elira-main
npm run dev
```
Visit http://localhost:3000 and check browser console for errors.

### Backend Functions Test
```bash
cd /Users/marquese/elira-main/functions
npm run build
firebase emulators:start
```
Check if functions load without errors.

## 🐛 Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check `NEXT_PUBLIC_FIREBASE_API_KEY` is correct
- Ensure no extra spaces or quotes

### "Stripe key not found"
- Verify `STRIPE_SECRET_KEY` is set in functions/.env
- Check it starts with sk_test_ or sk_live_

### "SendGrid authentication failed"
- Verify `SENDGRID_API_KEY` is correct
- Ensure it starts with SG.
- Check sender email is verified in SendGrid

### Functions not loading
- Check all required variables are set
- Verify FIREBASE_PRIVATE_KEY format (keep quotes and \n)
- Run `npm install` in functions folder

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify all required variables are set
3. Check service dashboards for API status
4. Review Firebase Functions logs

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mux Documentation](https://docs.mux.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
