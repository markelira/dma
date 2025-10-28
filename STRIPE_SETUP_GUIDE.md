# Stripe Product Setup Guide for DMA.hu

## Overview
This guide walks you through creating the 3 subscription products in your Stripe Dashboard for the DMA.hu MVP.

---

## Step 1: Access Stripe Dashboard

1. Log in to https://dashboard.stripe.com/
2. Make sure you're in **TEST MODE** first (toggle in top right)
3. Navigate to **Products** from the left sidebar

---

## Step 2: Create Product #1 - Monthly Subscription

1. Click **"+ Add product"**
2. Fill in the details:

**Product Information:**
- Name: `DMA.hu Havi Előfizetés`
- Description: `Korlátlan hozzáférés minden videóhoz, korlátlan csapattagokkal - havi fizetés`
- Image: (Optional - upload DMA logo if available)

**Pricing:**
- **Model**: Recurring
- **Price**: `15,000`
- **Currency**: `HUF` (Hungarian Forint)
- **Billing period**: `Monthly`
- **Price ID**: Will be generated - **COPY THIS!** (format: `price_xxxxx`)

**Additional settings:**
- Tax behavior: `Taxable`
- Tax code: `txcd_10000000` (Digital services)

3. Click **"Save product"**
4. **IMPORTANT**: Copy the Price ID (starts with `price_`) - you'll need this later

---

## Step 3: Create Product #2 - 6-Month Package

1. Click **"+ Add product"** again
2. Fill in the details:

**Product Information:**
- Name: `DMA.hu 6 Hónapos Csomag`
- Description: `Korlátlan hozzáférés minden videóhoz 6 hónapra - 10% kedvezmény`

**Pricing:**
- **Model**: Recurring
- **Price**: `81,000` (10% discount from 90,000)
- **Currency**: `HUF`
- **Billing period**: `Every 6 months`
- **Price ID**: Will be generated - **COPY THIS!**

**Additional settings:**
- Tax behavior: `Taxable`
- Tax code: `txcd_10000000`

3. Click **"Save product"**
4. Copy the Price ID

---

## Step 4: Create Product #3 - 12-Month Package

1. Click **"+ Add product"** again
2. Fill in the details:

**Product Information:**
- Name: `DMA.hu 12 Hónapos Csomag`
- Description: `Korlátlan hozzáférés minden videóhoz 12 hónapra - 12% kedvezmény (legjobb érték!)`

**Pricing:**
- **Model**: Recurring
- **Price**: `158,400` (12% discount from 180,000)
- **Currency**: `HUF`
- **Billing period**: `Yearly` (or `Every 12 months`)
- **Price ID**: Will be generated - **COPY THIS!**

**Additional settings:**
- Tax behavior: `Taxable`
- Tax code: `txcd_10000000`

3. Click **"Save product"**
4. Copy the Price ID

---

## Step 5: Configure Tax Settings

1. Navigate to **Settings** → **Tax**
2. Enable **Stripe Tax** for automatic Hungarian ÁFA calculation
3. Add tax registration for Hungary:
   - Country: Hungary
   - Tax ID: Your Hungarian tax number (Adószám)
   - ÁFA rate: 27% (standard Hungarian VAT)

---

## Step 6: Update Environment Variables

Once you have all 3 Price IDs, update your environment files:

### Update `.env.local` (already has Stripe keys, just verify):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx... (or pk_live_xxx for production)
```

### Update `functions/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_xxx... (or sk_live_xxx for production)
```

### Update SubscriptionPlans.tsx Price IDs:
Edit `/src/components/payment/SubscriptionPlans.tsx` and replace the TODO comments:

```typescript
// Line 56
priceId: 'price_xxxxx', // Replace with your actual monthly price ID

// Line 82  
priceId: 'price_xxxxx', // Replace with your actual 6-month price ID

// Line 110
priceId: 'price_xxxxx', // Replace with your actual 12-month price ID
```

---

## Step 7: Configure Webhooks

1. Navigate to **Developers** → **Webhooks**
2. Click **"+ Add endpoint"**
3. Endpoint URL: 
   - Development: `http://localhost:5003/stripe/webhook` (if using emulators)
   - Production: `https://your-cloud-function-url/stripe/webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.created`
   - `customer.updated`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)
6. Add to `functions/.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## Step 8: Test in Test Mode

Before going live:

1. Use Stripe test cards: `4242 4242 4242 4242` (any future date, any CVC)
2. Test all 3 subscription tiers
3. Verify webhooks are received
4. Check that subscriptions appear in Stripe Dashboard
5. Verify Hungarian ÁFA is calculated correctly (27%)

**Test checklist:**
- [ ] Monthly subscription works
- [ ] 6-month subscription works
- [ ] 12-month subscription works
- [ ] Tax calculation shows 27% ÁFA
- [ ] Webhooks fire correctly
- [ ] Invoice generation works
- [ ] Customer portal accessible

---

## Step 9: Go Live

Once testing is complete:

1. Switch to **LIVE MODE** in Stripe Dashboard
2. Repeat Steps 2-4 to create the same 3 products in Live mode
3. Copy the **LIVE Price IDs**
4. Update environment variables with live keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx`
   - `STRIPE_SECRET_KEY=sk_live_xxx`
5. Update Price IDs in SubscriptionPlans.tsx with live versions
6. Configure live webhook endpoint
7. Deploy to production

---

## Summary

Your 3 Stripe Products:

| Product | Price | Discount | Billing Period | Price ID |
|---------|-------|----------|----------------|----------|
| Havi Előfizetés | 15,000 HUF | - | Monthly | `price_xxxxx` |
| 6 Hónapos Csomag | 81,000 HUF | 10% | Every 6 months | `price_xxxxx` |
| 12 Hónapos Csomag | 158,400 HUF | 12% | Yearly | `price_xxxxx` |

---

## Next Steps

After Stripe setup is complete:
1. Update the Price IDs in SubscriptionPlans.tsx
2. Test the checkout flow
3. Verify webhook integration
4. Ready for team account implementation (Week 1, Day 5-7)

---

**Questions?** Check Stripe documentation: https://stripe.com/docs/billing/subscriptions

---

## ✅ COMPLETED SETUP (2025-10-28)

### Stripe Product Created:
- **Product ID**: `prod_TJoO7Udjt6rxXB`

### Price IDs Configured:
| Plan | Price ID | Status |
|------|----------|--------|
| Monthly (15,000 HUF) | `price_1SNAlsGe8tBqGEXM8vEOVhgY` | ✅ Added to code |
| 6-Month (81,000 HUF) | `price_1SNAlsGe8tBqGEXMrzFW59z5` | ✅ Added to code |
| 12-Month (158,400 HUF) | `price_1SNAlsGe8tBqGEXMR98t1RJX` | ✅ Added to code |

### Code Updated:
- ✅ `/src/components/payment/SubscriptionPlans.tsx` - Lines 56, 82, 110

### Next Steps:
1. ⏳ Configure webhook endpoint (once functions are deployed)
2. ⏳ Test checkout flow with test cards
3. ⏳ Verify webhook events fire correctly
4. ⏳ Switch to Live mode when ready for production
