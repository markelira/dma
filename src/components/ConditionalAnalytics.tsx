'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { hasAnalyticsConsent } from '@/components/CookieConsent';

/**
 * Conditionally loads Google Analytics only after cookie consent
 * GDPR-compliant: No tracking scripts without explicit consent
 * Uses official @next/third-parties/google for optimal loading
 */
export function ConditionalAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check initial consent
    if (hasAnalyticsConsent()) {
      setHasConsent(true);
    }

    // Listen for consent events
    const handleConsent = () => {
      setHasConsent(true);
    };

    window.addEventListener('cookie-consent-accepted', handleConsent);

    return () => {
      window.removeEventListener('cookie-consent-accepted', handleConsent);
    };
  }, []);

  // Use env var with hardcoded fallback for production
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-XB7ESESYVS';

  // Don't load if no consent
  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}

export default ConditionalAnalytics;
