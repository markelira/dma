# Firebase Secrets Setup Guide

## 🔍 **Problem Identified**

**Error:** `Firebase: Error (auth/invalid-api-key)`
- A GitHub Actions workflow-ban hiányzó vagy érvénytelen Firebase API key
- A Next.js build folyamatban a Firebase konfiguráció nem megfelelő

## 🛠️ **Solution: Set Up Firebase Secrets**

### **Step 1: Get Firebase Configuration**

1. **Go to Firebase Console:** https://console.firebase.google.com/
2. **Select your project:** `DMA-PROJECT-ID`
3. **Go to Project Settings** (gear icon)
4. **Scroll down to "Your apps"** section
5. **Find your web app** or create a new one
6. **Copy the configuration object**

### **Step 2: Add Secrets to GitHub**

1. **Go to your GitHub repository:** https://github.com/markelira/elira
2. **Click Settings** tab
3. **Click "Secrets and variables"** → **"Actions"**
4. **Click "New repository secret"** for each variable

### **Step 3: Required Secrets**

Add these secrets with the exact names:

| Secret Name | Value from Firebase Config |
|-------------|---------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `measurementId` (optional) |

### **Step 4: Example Firebase Config**

Your Firebase config should look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "DMA-PROJECT-ID.firebaseapp.com", // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "DMA-PROJECT-ID", // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "DMA-PROJECT-ID.appspot.com", // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789", // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123", // → NEXT_PUBLIC_FIREBASE_APP_ID
  measurementId: "G-ABC123" // → NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
};
```

### **Step 5: Verify Secrets**

After adding all secrets:

1. **Push a new commit** to trigger the workflow
2. **Check the "Check Firebase Configuration" step** in the workflow
3. **Should see:** "✅ All required Firebase environment variables are set!"

## 🔧 **Troubleshooting**

### **If secrets are missing:**
- The workflow will fail at the "Check Firebase Configuration" step
- You'll see exactly which secrets are missing
- Add the missing secrets and try again

### **If API key is invalid:**
- Double-check the API key from Firebase Console
- Make sure you're using the correct project
- Verify the web app configuration

### **If build still fails:**
- Check that all secrets are properly named (exact case matters)
- Ensure no extra spaces in the secret values
- Verify the Firebase project is active

## 📊 **Verification Steps**

1. ✅ **All secrets added to GitHub**
2. ✅ **Workflow "Check Firebase Configuration" passes**
3. ✅ **Build completes without Firebase errors**
4. ✅ **Deployment succeeds**

## 🚨 **Important Notes**

- **Never commit Firebase config** to the repository
- **Use GitHub Secrets** for all sensitive data
- **The `NEXT_PUBLIC_` prefix** is required for client-side access
- **Restart the workflow** after adding secrets

---

**Status:** ⚠️ **NEEDS SECRETS SETUP**  
**Priority:** 🔥 **CRITICAL** - Required for deployment 