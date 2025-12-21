'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_VERSION = '1.0'; // Increment when privacy policy changes

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

export interface ConsentState {
  status: ConsentStatus;
  version: string;
  timestamp: string;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Get the current consent state from localStorage
 */
export function getConsentState(): ConsentState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as ConsentState;

    // Check if consent version matches current
    if (consent.version !== CONSENT_VERSION) {
      return null; // Force re-consent on version change
    }

    return consent;
  } catch {
    return null;
  }
}

/**
 * Check if analytics consent was given
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getConsentState();
  return consent?.status === 'accepted' && consent?.analytics === true;
}

/**
 * Cookie Consent Banner Component
 *
 * GDPR-compliant cookie consent with:
 * - Clear explanation of cookies used
 * - Accept/Reject options
 * - Link to privacy policy
 * - Persistent storage of choice
 */
export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if consent was already given
    const consent = getConsentState();
    if (!consent) {
      setIsVisible(true);
    }
    setIsLoading(false);
  }, []);

  const saveConsent = (accepted: boolean) => {
    const consent: ConsentState = {
      status: accepted ? 'accepted' : 'rejected',
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      analytics: accepted,
      marketing: accepted,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);

    // Dispatch custom event so analytics can initialize
    if (accepted) {
      window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
    }
  };

  const handleAccept = () => {
    saveConsent(true);
  };

  const handleReject = () => {
    saveConsent(false);
  };

  // Don't render during SSR or while loading
  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white border-t border-gray-200 shadow-lg"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Close button for mobile */}
          <button
            onClick={handleReject}
            className="absolute top-2 right-2 md:hidden p-2 text-gray-400 hover:text-gray-600"
            aria-label="Elutasítás"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex-1 pr-8 md:pr-0">
            <h2
              id="cookie-consent-title"
              className="text-lg font-semibold text-gray-900 mb-1"
            >
              Cookie beállítások
            </h2>
            <p
              id="cookie-consent-description"
              className="text-sm text-gray-600"
            >
              A weboldal sütiket használ a felhasználói élmény javítása és az oldal
              működésének elemzése érdekében. Az "Elfogadom" gombra kattintva
              hozzájárul az analitikai sütik használatához.{' '}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Adatvédelmi tájékoztató
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleReject}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Csak szükségesek
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
            >
              Elfogadom
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
