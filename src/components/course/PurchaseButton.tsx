'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '@/lib/payment';
import { COURSE_CONFIG } from '@/types/payment';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useEnrollmentStatus } from '@/hooks/useEnrollmentStatus';
import { Lock, ArrowRight } from 'lucide-react';

interface PurchaseButtonProps {
  courseId?: string;
  course?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    stripePriceId?: string;
    isFree?: boolean;
  };
  onPurchaseStart?: () => void;
  onPurchaseSuccess?: () => void;
  onPurchaseError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

// Function to determine if background is dark
const isDarkBackground = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  const computedStyle = window.getComputedStyle(element);
  const bgColor = computedStyle.backgroundColor;
  
  // Parse RGB values
  const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // Calculate luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  
  // If no background color or transparent, check parent
  return isDarkBackground(element.parentElement);
};

const PurchaseButton: React.FC<PurchaseButtonProps> = ({
  courseId = 'ai-copywriting-course',
  course,
  onPurchaseStart,
  onPurchaseSuccess,
  onPurchaseError,
  className = '',
  disabled = false
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [textColor, setTextColor] = useState('text-academic-slate-600');
  const [purchaseTriggered, setPurchaseTriggered] = useState(false);
  const currentCourseId = course?.id || courseId;
  const { data: enrollmentData, isLoading: enrollmentLoading } = useEnrollmentStatus(currentCourseId);

  // Auto-trigger purchase if user just authenticated with purchase intent
  useEffect(() => {
    const triggerPurchaseIfIntended = async () => {
      console.log('[PurchaseButton - Auto-trigger] Checking for purchase intent');
      console.log('[PurchaseButton - Auto-trigger] User:', !!user, 'Triggered:', purchaseTriggered, 'Loading:', isLoading);

      if (user && !purchaseTriggered && !isLoading && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const purchaseIntent = params.get('purchaseIntent');
        const intentCourseId = params.get('courseId');

        console.log('[PurchaseButton - Auto-trigger] URL params - intent:', purchaseIntent, 'courseId:', intentCourseId);
        console.log('[PurchaseButton - Auto-trigger] Current courseId:', currentCourseId);

        if (purchaseIntent === 'true' && intentCourseId === currentCourseId) {
          console.log('[PurchaseButton - Auto-trigger] ✅ Match found! Auto-triggering purchase...');

          // Remove purchase intent from URL
          params.delete('purchaseIntent');
          params.delete('courseId');
          const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
          window.history.replaceState({}, '', newUrl);
          console.log('[PurchaseButton - Auto-trigger] URL cleaned:', newUrl);

          // Mark as triggered and wait a bit for state to settle
          setPurchaseTriggered(true);
          setTimeout(() => {
            // Manually trigger the purchase flow
            const button = document.querySelector('[data-purchase-button]') as HTMLButtonElement;
            if (button) {
              console.log('[PurchaseButton - Auto-trigger] Clicking purchase button');
              button.click();
            } else {
              console.error('[PurchaseButton - Auto-trigger] Purchase button not found!');
            }
          }, 500);
        } else {
          console.log('[PurchaseButton - Auto-trigger] No match, skipping auto-trigger');
        }
      }
    };

    triggerPurchaseIfIntended();
  }, [user, currentCourseId, purchaseTriggered, isLoading]);

  // Check background and set text color
  useEffect(() => {
    const checkBackground = () => {
      const container = document.querySelector('.text-center');
      if (isDarkBackground(container as HTMLElement)) {
        setTextColor('text-white');
      } else {
        setTextColor('text-academic-slate-600');
      }
    };
    
    checkBackground();
    // Re-check when component mounts or updates
    const observer = new MutationObserver(checkBackground);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  const handlePurchase = async () => {
    const currentCourseId = course?.id || courseId;

    console.log('[PurchaseButton - Handler] Purchase initiated for course:', currentCourseId);
    console.log('[PurchaseButton - Handler] User:', !!user, 'Loading:', isLoading, 'Disabled:', disabled);

    // If not logged in, redirect to login page with purchase intent
    // After auth, user will be redirected back and purchase will be triggered
    if (!user) {
      const currentUrl = window.location.pathname + window.location.search;
      const authUrl = `/login?redirect_to=${encodeURIComponent(currentUrl)}&courseId=${currentCourseId}&purchaseIntent=true`;
      console.log('[PurchaseButton - Handler] User not authenticated, redirecting to:', authUrl);
      router.push(authUrl);
      return;
    }

    if (isLoading || disabled) {
      console.log('[PurchaseButton - Handler] Blocked - Loading:', isLoading, 'Disabled:', disabled);
      return;
    }

    if (enrollmentData?.enrolled) {
      onPurchaseError?.('Már beiratkoztál erre a tartalomra');
      return;
    }

    // Check if course is free
    if (course?.isFree) {
      onPurchaseError?.('Ez a tartalom ingyenes, nincs szükség fizetésre');
      return;
    }

    // Use default Stripe Price ID if course doesn't have one
    const stripePriceId = course?.stripePriceId || COURSE_CONFIG.stripePriceId || 'price_1SGGmxHhqyKpFIBM2f3kM13h';

    setIsLoading(true);
    onPurchaseStart?.();

    try {
      // Get Firebase auth token
      console.log('[PurchaseButton - API] Getting auth token for user:', user?.uid);
      console.log('[PurchaseButton - API] Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

      const token = await auth.currentUser?.getIdToken();
      console.log('[PurchaseButton - API] Token obtained:', token ? 'Yes' : 'No', 'Length:', token?.length);

      if (!token) {
        throw new Error('Authentication required');
      }

      // Create payment session using local API route
      const apiUrl = `/api/courses/${currentCourseId}/purchase`;
      const requestBody = {
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&courseId=${currentCourseId}`,
        cancelUrl: `${window.location.origin}/payment/cancel?courseId=${currentCourseId}`
      };

      console.log('[PurchaseButton - API] Making POST request to:', apiUrl);
      console.log('[PurchaseButton - API] Request body:', requestBody);
      console.log('[PurchaseButton - API] Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[PurchaseButton - API] Response received - Status:', response.status, 'OK:', response.ok);
      console.log('[PurchaseButton - API] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('[PurchaseButton - API] Error response JSON:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('[PurchaseButton - API] Error response text:', errorText);
          errorData = { error: 'Invalid response from server' };
        }
        throw new Error(errorData.error || 'Fizetési munkamenet létrehozása sikertelen');
      }

      const sessionData = await response.json();

      if (!sessionData.success) {
        throw new Error(sessionData.error || 'Failed to create checkout session');
      }

      // If we have a checkout URL directly from the session creation, use it
      if (sessionData.checkoutUrl) {
        window.location.href = sessionData.checkoutUrl;
        return;
      }

      // Fallback: If no checkout URL, throw error
      throw new Error('No checkout URL received from payment session');

      // This won't execute due to redirect, but just in case
      onPurchaseSuccess?.();
    } catch (error: any) {
      console.error('Purchase error:', error);
      onPurchaseError?.(error.message || 'Fizetési hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  // Show "Go to Dashboard" button if user is enrolled or has course access
  if (enrollmentData?.enrolled || enrollmentData?.hasAccess) {
    return (
      <div className={`text-center ${className}`}>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span className="flex items-center justify-center gap-2">
            Irányítópult megnyitása
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <button
        data-purchase-button
        onClick={handlePurchase}
        disabled={isLoading || disabled}
        className={`
          w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700
          text-white font-bold px-8 py-4 rounded-xl text-base
          transition-all duration-200 shadow-lg hover:shadow-xl
          flex items-center justify-center gap-2
          ${isLoading || disabled
            ? 'cursor-not-allowed opacity-50'
            : ''
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Fizetés folyamatban...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Jelentkezés a masterclassra - 89 990 Ft</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
};

export default PurchaseButton;