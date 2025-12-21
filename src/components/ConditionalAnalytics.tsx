'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAnalyticsConsent } from '@/components/CookieConsent';

/**
 * Conditionally loads Google Analytics only after cookie consent
 * GDPR-compliant: No tracking scripts without explicit consent
 */
export function ConditionalAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Check initial consent
    if (hasAnalyticsConsent()) {
      setShouldLoad(true);
    }

    // Listen for consent events
    const handleConsent = () => {
      setShouldLoad(true);
    };

    window.addEventListener('cookie-consent-accepted', handleConsent);

    return () => {
      window.removeEventListener('cookie-consent-accepted', handleConsent);
    };
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Don't load if no consent or no GA ID
  if (!shouldLoad || !gaId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config','${gaId}', {
  page_path: window.location.pathname,
  anonymize_ip: true
});`}
      </Script>
    </>
  );
}

export default ConditionalAnalytics;
