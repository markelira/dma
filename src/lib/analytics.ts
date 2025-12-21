import { Analytics, getAnalytics, logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import app from '@/lib/firebase';
import { hasAnalyticsConsent } from '@/components/CookieConsent';

let analytics: Analytics | null = null;
let isInitialized = false;

/**
 * Initialize analytics only after consent is given
 * GDPR-compliant: No tracking without explicit consent
 */
function initializeAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  if (isInitialized) return analytics;

  // Check for consent before initializing
  if (!hasAnalyticsConsent()) {
    console.log('[Analytics] Waiting for cookie consent...');
    return null;
  }

  try {
    analytics = getAnalytics(app);
    setAnalyticsCollectionEnabled(analytics, true);
    isInitialized = true;
    console.log('[Analytics] Initialized with consent');
    return analytics;
  } catch (error) {
    console.error('[Analytics] Failed to initialize:', error);
    return null;
  }
}

/**
 * Listen for consent events and initialize when accepted
 */
if (typeof window !== 'undefined') {
  // Try to initialize on load if consent already given
  initializeAnalytics();

  // Listen for new consent
  window.addEventListener('cookie-consent-accepted', () => {
    console.log('[Analytics] Consent received, initializing...');
    initializeAnalytics();
  });
}

/**
 * Track a custom event
 * Only tracks if analytics consent was given
 */
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  const analyticsInstance = initializeAnalytics();
  if (!analyticsInstance) {
    console.log(`[Analytics] Event skipped (no consent): ${eventName}`);
    return;
  }

  // Filter out any PII from parameters
  const safeParams = parameters ? sanitizeEventParams(parameters) : undefined;
  logEvent(analyticsInstance, eventName, safeParams);
};

/**
 * Track a page view
 * Only tracks if analytics consent was given
 */
export const trackPageView = (pageName: string) => {
  trackEvent('page_view', { page_name: pageName });
};

/**
 * Sanitize event parameters to remove potential PII
 * GDPR compliance: Never log emails, names, or other personal data
 */
function sanitizeEventParams(params: Record<string, unknown>): Record<string, unknown> {
  const piiFields = ['email', 'name', 'firstName', 'lastName', 'phone', 'address', 'userId', 'user_id'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    // Skip known PII fields
    if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      continue;
    }

    // Skip string values that look like emails
    if (typeof value === 'string' && value.includes('@')) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Disable analytics collection (for opt-out)
 */
export const disableAnalytics = () => {
  if (analytics) {
    setAnalyticsCollectionEnabled(analytics, false);
    console.log('[Analytics] Collection disabled');
  }
};

/**
 * Check if analytics is currently enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return isInitialized && hasAnalyticsConsent();
};
