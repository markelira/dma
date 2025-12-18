# DMA Masterclass Loading Issue - Diagnostic Report

**Date:** December 18, 2025
**Domain:** masterclass.dma.hu
**Status:** CRITICAL - Site intermittently fails to load

---

## Executive Summary

After a comprehensive investigation of the codebase, I've identified **multiple critical issues** that together create a "perfect storm" causing the site to fail to load or load extremely slowly. The main culprits are:

1. **ReactQueryProvider returns `null` on initial render** - blocks entire app
2. **Dual Auth Provider race condition** - two auth systems competing
3. **Zustand rehydration timing issue** - `authReady` set prematurely
4. **SSR-unsafe code in error handling** - `navigator.onLine` access without checks
5. **Cloud Functions cold start delays** - compounding latency

---

## Critical Issues (Must Fix)

### 1. ReactQueryProvider Blocks Initial Render

**File:** `src/components/react-query-provider.tsx` (lines 20-22)

**Problem:**
```typescript
if (!mounted) {
  return null  // BLOCKS ENTIRE APP
}
```

**Impact:** On the first render, the provider returns `null` instead of children. This means:
- The **entire app content is blocked** during the hydration cycle
- All child components (AuthProvider, pages) don't render
- Users see a blank/loading page for 100-500ms minimum
- If combined with network latency, this can extend significantly

**Root Cause:** This pattern was added to prevent hydration mismatches with React Query, but it's too aggressive.

---

### 2. Dual Auth Provider Race Condition

**Files:**
- `src/components/auth-provider.tsx` (uses Zustand)
- `src/contexts/AuthContext.tsx` (uses React Context)
- `src/app/(dashboard)/layout.tsx` (uses BOTH)

**Problem:** There are TWO different auth providers:
1. `AuthProvider` from `@/components/auth-provider` - wraps entire app in root layout
2. `AuthProvider` from `@/contexts/AuthContext` - wraps dashboard layout again

**Impact:**
- **Double `onAuthStateChanged` listeners** on Firebase
- **Double Firestore reads** for user data
- **Race condition** between two state systems
- Auth state becomes unpredictable
- Dashboard can redirect incorrectly during the race

**Evidence:** In `src/app/(dashboard)/layout.tsx`:
```typescript
import { AuthProvider } from '@/contexts/AuthContext'  // Line 10
// ... later wraps children in <AuthProvider> again
```

---

### 3. Zustand Rehydration Sets `authReady` Too Early

**File:** `src/stores/authStore.ts` (lines 100-118)

**Problem:**
```typescript
onRehydrateStorage: () => (state) => {
  if (state) {
    state.isLoading = false
    state.authReady = true  // SET IMMEDIATELY
  }
}
```

**Impact:** Zustand sets `authReady = true` **synchronously** after localStorage rehydration, but:
- Firebase's `onAuthStateChanged` hasn't fired yet
- User data might be stale from previous session
- Dashboard layout checks `if (authReady && !isLoading)` and might redirect incorrectly

**Timeline:**
1. Zustand rehydrates from localStorage → `authReady = true` (with stale user)
2. Dashboard renders, sees stale user, possibly redirects
3. ~100-500ms later, Firebase's `onAuthStateChanged` fires with fresh data
4. Dashboard re-renders with new state - user sees flash/confusion

---

### 4. SSR-Unsafe Code Accesses `navigator`

**File:** `src/lib/queryErrorHandler.ts` (line 29)

**Problem:**
```typescript
if (!navigator.onLine || error?.code === 'NETWORK_ERROR' || ...)
```

**Impact:**
- `navigator` doesn't exist during SSR
- Can throw "navigator is not defined" during Next.js build/SSR
- Would crash the QueryClient initialization

**Also in:** `src/hooks/useErrorHandling.ts` (line 112-113)
```typescript
const isNetworkError = !navigator.onLine || ...
```

---

### 5. Cloud Functions Cold Start Compounding

**Evidence from logs:** Functions like `getCategories`, `getInstructors` are called on every homepage load.

**Impact:**
- Cold starts can add 2-5 seconds
- Multiple functions called in parallel = multiple cold starts
- Combined with frontend blocking issues = severe delays

---

## Secondary Issues (Should Fix)

### 6. `useInstructors` Waits for `authReady`

**File:** `src/hooks/useInstructorQueries.ts` (line 89)

```typescript
enabled: authReady,  // Waits for auth before fetching public data
```

**Problem:** Instructors are public data, but the query waits for auth to be ready. Combined with the auth race condition, this delays the homepage carousel.

---

### 7. ErrorProvider Hijacks History API

**File:** `src/components/providers/ErrorProvider.tsx` (lines 59-70)

```typescript
history.pushState = function(...args) { ... }
history.replaceState = function(...args) { ... }
```

**Risk:** Modifying global `history` can interfere with Next.js router, causing:
- Navigation state out of sync
- Potential infinite loops in some edge cases

---

### 8. No Timeout on Cloud Function Calls

**Example:** `useSubscriptionStatus` calls `httpsCallable` with no explicit timeout.

Default Firebase timeout is 70 seconds - if a function hangs, the UI waits 70 seconds.

---

## Why This Manifests Randomly

The combination of issues creates a non-deterministic failure pattern:

1. **First Visit (no cache):**
   - ReactQueryProvider returns `null` (200-500ms)
   - Firebase SDK initializes (100-300ms)
   - `onAuthStateChanged` fires (100-500ms)
   - Cloud Functions cold start (2000-5000ms if cold)
   - **Total: 2.4-6.3 seconds before any content**

2. **Returning Visit (with cache):**
   - Zustand rehydrates stale user → `authReady = true`
   - Dashboard might redirect based on stale data
   - Firebase `onAuthStateChanged` fires → different user state
   - **Flash of wrong content, then redirect**

3. **Network Variability:**
   - Firebase cold starts are region-dependent
   - Vercel edge caching varies by location
   - Users on slower networks experience compounded delays

---

## Recommended Fixes

### Priority 1: Fix ReactQueryProvider (CRITICAL)

```typescript
// src/components/react-query-provider.tsx
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [client] = useState(() => createQueryClient())

  // Remove the mounted check - let children render immediately
  // React Query handles hydration internally
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### Priority 2: Consolidate Auth Providers (CRITICAL)

Remove the duplicate AuthProvider from dashboard layout:

```typescript
// src/app/(dashboard)/layout.tsx
// DELETE: import { AuthProvider } from '@/contexts/AuthContext'
// DELETE: The <AuthProvider> wrapper around children
```

Use ONLY the Zustand-based auth-provider.tsx from root layout.

### Priority 3: Fix Zustand Rehydration (HIGH)

Don't set `authReady` during rehydration - let the AuthProvider do it:

```typescript
// src/stores/authStore.ts
onRehydrateStorage: () => (state) => {
  if (state) {
    state.isLoading = false
    // DON'T set authReady here - wait for onAuthStateChanged
    // state.authReady = true  // REMOVE THIS LINE
  }
}
```

### Priority 4: Add SSR Guards (HIGH)

```typescript
// src/lib/queryErrorHandler.ts
const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

// src/hooks/useErrorHandling.ts
const isNetworkError = (typeof navigator !== 'undefined' && !navigator.onLine) || ...
```

### Priority 5: Remove Auth Dependency for Public Data (MEDIUM)

```typescript
// src/hooks/useInstructorQueries.ts
export const useInstructors = () => {
  return useQuery<Instructor[]>({
    queryKey: ['instructors'],
    queryFn: async () => { ... },
    // Remove: enabled: authReady,
    staleTime: 5 * 60 * 1000,
  });
};
```

### Priority 6: Add Timeouts to Cloud Functions (MEDIUM)

```typescript
// Create a wrapper with timeout
const callWithTimeout = async (fn: HttpsCallable, data: any, timeout = 10000) => {
  return Promise.race([
    fn(data),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Function timeout')), timeout)
    )
  ])
}
```

---

## Quick Verification Test

After applying fixes, verify with:

```bash
# 1. Clear browser cache completely
# 2. Test in incognito mode
# 3. Run these curl tests:

# Test TTFB (Time To First Byte)
curl -w "TTFB: %{time_starttransfer}s, Total: %{time_total}s\n" -o /dev/null -s https://masterclass.dma.hu

# Expected: TTFB < 1s, Total < 3s
```

---

## Monitoring Recommendations

1. **Add performance logging:**
   ```typescript
   console.log(`[PERF] ReactQueryProvider mounted at ${Date.now()}`)
   console.log(`[PERF] AuthProvider ready at ${Date.now()}`)
   ```

2. **Use React DevTools Profiler** to identify slow components

3. **Add Vercel Speed Insights** for real-user monitoring

4. **Set up Firebase Performance Monitoring** for Cloud Function latency

---

## Files Modified in This Analysis

Files that need immediate attention:
- `src/components/react-query-provider.tsx`
- `src/stores/authStore.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/lib/queryErrorHandler.ts`
- `src/hooks/useErrorHandling.ts`
- `src/hooks/useInstructorQueries.ts`

---

## Conclusion

The site loading issues are caused by **multiple interacting problems**, not a single bug. The fixes must be applied together:

1. Remove the blocking `null` return in ReactQueryProvider
2. Eliminate the duplicate AuthProvider
3. Fix the Zustand rehydration timing
4. Add SSR guards for `navigator`
5. Remove unnecessary auth dependencies for public data

After these fixes, the site should load in under 2 seconds consistently.
