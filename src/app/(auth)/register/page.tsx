'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { UnifiedRegisterForm, ValuePropositionSection } from '@/components/auth/UnifiedRegisterForm';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';
import Link from 'next/link';
import Footer from '@/components/landing-home/ui/footer';
import { Loader2 } from 'lucide-react';
import { clearRecentRegistrationFlag } from '@/hooks/useSubscriptionStatus';
import { useQueryClient } from '@tanstack/react-query';

// Hide the auth layout header on this page (we have logo in left panel)
const HideAuthHeader = () => (
  <style jsx global>{`
    header.absolute.z-30 {
      display: none !important;
    }
  `}</style>
);

interface InviteData {
  valid: boolean;
  companyName: string;
  employeeEmail: string;
  employeeName: string;
  expired?: boolean;
}

interface PreRegistrationData {
  valid: boolean;
  preRegistrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

// Interfaces for Cloud Functions
interface GetPendingRegistrationResponse {
  found: boolean;
  alreadyCompleted?: boolean;
  data?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
    currentStep: 1 | 2 | 3;
    pendingEmployees: Array<{ email: string; firstName: string; lastName: string }>;
    stripeSessionId?: string;
  };
}

interface VerifyPaymentResponse {
  paymentComplete: boolean;
  subscriptionId?: string;
  customerId?: string;
}

interface UnifiedRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  billingEmail?: string;
}

interface UnifiedRegistrationResponse {
  success: boolean;
  companyId: string;
  userId: string;
}

interface AddEmployeeInput {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Employee invite handling
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Pre-registration handling
  const [preRegData, setPreRegData] = useState<PreRegistrationData | null>(null);
  const [preRegLoading, setPreRegLoading] = useState(false);
  const [preRegError, setPreRegError] = useState('');

  // Payment recovery state
  const [isProcessingPaymentReturn, setIsProcessingPaymentReturn] = useState(false);

  // Get params from URL
  const inviteToken = searchParams?.get('invite');
  const preregisterToken = searchParams?.get('preregister');
  const paymentComplete = searchParams?.get('payment_complete');

  // Verify invite token when present
  useEffect(() => {
    const verifyInvite = async () => {
      if (!inviteToken) return;

      setInviteLoading(true);
      setInviteError('');

      try {
        const verify = httpsCallable<{ token: string }, InviteData>(
          functions,
          'verifyEmployeeInvite'
        );
        const result = await verify({ token: inviteToken });

        if (result.data.valid) {
          setInviteData(result.data);
          console.log('[Register] Valid invite for company:', result.data.companyName);
        } else if (result.data.expired) {
          setInviteError('Ez a meghívó lejárt. Kérj új meghívót a cég adminisztrátorától.');
        } else {
          setInviteError('Érvénytelen meghívó link');
        }
      } catch (err: any) {
        console.error('[Register] Error verifying invite:', err);
        if (err.code === 'not-found') {
          setInviteError('Ez a meghívó nem található vagy már fel lett használva');
        } else {
          // If verification fails, still allow registration but don't show company info
          console.log('[Register] Invite verification failed, allowing normal registration');
        }
      } finally {
        setInviteLoading(false);
      }
    };

    verifyInvite();
  }, [inviteToken]);

  // Verify pre-registration token when present
  useEffect(() => {
    const verifyPreRegistration = async () => {
      if (!preregisterToken) return;

      setPreRegLoading(true);
      setPreRegError('');

      try {
        const verify = httpsCallable<{ token: string }, PreRegistrationData>(
          functions,
          'verifyPreRegistration'
        );
        const result = await verify({ token: preregisterToken });

        if (result.data.valid) {
          setPreRegData(result.data);
          console.log('[Register] Valid pre-registration for:', result.data.email);
        }
      } catch (err: any) {
        console.error('[Register] Error verifying pre-registration:', err);
        if (err.code === 'not-found') {
          setPreRegError('Érvénytelen vagy lejárt előregisztrációs link');
        } else if (err.code === 'failed-precondition') {
          setPreRegError(err.message || 'Ez az előregisztráció már fel lett használva vagy lejárt');
        } else {
          setPreRegError('Hiba történt az előregisztráció ellenőrzésekor');
        }
      } finally {
        setPreRegLoading(false);
      }
    };

    verifyPreRegistration();
  }, [preregisterToken]);

  // Complete registration helper
  const completeRegistrationFromPending = useCallback(async (pendingData: GetPendingRegistrationResponse['data']) => {
    if (!pendingData || !user) return false;

    try {
      console.log('[Register] Completing registration from pending data...');

      // Call completeUnifiedRegistration Cloud Function
      const completeRegistrationFn = httpsCallable<UnifiedRegistrationInput, UnifiedRegistrationResponse>(
        functions,
        'completeUnifiedRegistration'
      );

      const result = await completeRegistrationFn({
        firstName: pendingData.firstName,
        lastName: pendingData.lastName,
        email: pendingData.email,
        phone: pendingData.phone,
        companyName: pendingData.companyName,
        billingEmail: pendingData.email
      });

      console.log('[Register] Registration completed:', result.data);

      if (result.data.success) {
        // Send employee invites if any
        if (pendingData.pendingEmployees && pendingData.pendingEmployees.length > 0) {
          console.log('[Register] Sending employee invites:', pendingData.pendingEmployees.length);
          const addEmployee = httpsCallable<AddEmployeeInput, { success: boolean }>(functions, 'addEmployee');

          for (const employee of pendingData.pendingEmployees) {
            try {
              await addEmployee({
                companyId: result.data.companyId,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName
              });
              console.log(`[Register] Invite sent to ${employee.email}`);
            } catch (inviteError: any) {
              console.error(`[Register] Failed to invite ${employee.email}:`, inviteError);
            }
          }
        }

        // Force token refresh
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.getIdToken(true);
          await currentUser.reload();
        }

        // Update React auth state with new claims
        await refreshUser();

        // Small delay to ensure state propagates
        await new Promise(resolve => setTimeout(resolve, 300));

        // CRITICAL: Clear the "recently registered" flag so subscription check actually runs
        // Without this, useSubscriptionStatus returns fake "no subscription" for 60 seconds
        clearRecentRegistrationFlag();
        // Invalidate the React Query cache to force fresh subscription check
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });

        // Set welcome popup flag
        sessionStorage.setItem('showWelcomePopup', 'true');
        // Dismiss trial popup since user just completed payment
        sessionStorage.setItem('trialPopupDismissed', 'true');

        return true;
      }
      return false;
    } catch (err) {
      console.error('[Register] Error completing registration:', err);
      return false;
    }
  }, [user, refreshUser, queryClient]);

  // Handle payment complete return from Stripe
  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (paymentComplete !== 'true' || !user || authLoading || isProcessingPaymentReturn) return;

      setIsProcessingPaymentReturn(true);
      console.log('[Register] Payment complete detected, verifying...');

      try {
        // Get pending registration
        const getPendingFn = httpsCallable<void, GetPendingRegistrationResponse>(
          functions,
          'getPendingRegistration'
        );
        const pendingResult = await getPendingFn();

        if (pendingResult.data.alreadyCompleted) {
          console.log('[Register] Registration already completed, refreshing auth and redirecting...');
          // Webhook completed registration - need to refresh auth state before redirect
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.getIdToken(true); // Force token refresh to get new claims
            await refreshUser(); // Update React + Zustand state
          }
          // CRITICAL: Clear the "recently registered" flag so subscription check actually runs
          clearRecentRegistrationFlag();
          // Invalidate the React Query cache to force fresh subscription check
          queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
          // Set popup flags
          sessionStorage.setItem('showWelcomePopup', 'true');
          sessionStorage.setItem('trialPopupDismissed', 'true');
          router.push('/company/dashboard');
          return;
        }

        if (!pendingResult.data.found || !pendingResult.data.data) {
          console.log('[Register] No pending registration found');
          setIsProcessingPaymentReturn(false);
          return;
        }

        const pendingData = pendingResult.data.data;

        // If there's a stripe session ID, verify the payment
        if (pendingData.stripeSessionId) {
          const verifyPaymentFn = httpsCallable<{ sessionId: string }, VerifyPaymentResponse>(
            functions,
            'verifyStripePayment'
          );
          const paymentResult = await verifyPaymentFn({ sessionId: pendingData.stripeSessionId });

          if (paymentResult.data.paymentComplete) {
            console.log('[Register] Payment verified, completing registration...');
            const success = await completeRegistrationFromPending(pendingData);
            if (success) {
              router.push('/company/dashboard');
              return;
            }
          } else {
            console.log('[Register] Payment not complete yet');
          }
        }
      } catch (err) {
        console.error('[Register] Error handling payment return:', err);
      }

      setIsProcessingPaymentReturn(false);
    };

    handlePaymentReturn();
  }, [paymentComplete, user, authLoading, router, isProcessingPaymentReturn, completeRegistrationFromPending]);

  // NOTE: Registration state checking and redirect logic is handled by UnifiedRegisterForm
  // The form calls getPendingRegistration and handles recovery/redirect appropriately
  // We removed the duplicate check here to prevent race conditions and double API calls

  // Only show loading on initial mount for invite/pre-registration loading or payment processing
  // Don't show loading for authLoading after initial mount - this prevents form remounting
  // Also show loading immediately when URL has payment_complete=true (before effect runs)
  if (inviteLoading || preRegLoading || isProcessingPaymentReturn || paymentComplete === 'true') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-secondary mb-4" />
        <p className="text-sm text-gray-600">
          {inviteLoading ? 'Meghívó ellenőrzése...' :
           preRegLoading ? 'Előregisztráció ellenőrzése...' :
           'Fizetés ellenőrzése...'}
        </p>
      </div>
    );
  }

  // Show invite error if present
  if (inviteError) {
    return (
      <div className="text-center">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{inviteError}</p>
        </div>
        <p className="text-gray-600 mb-4">
          Továbbra is regisztrálhatsz:
        </p>
        <button
          onClick={() => setInviteError('')}
          className="btn bg-gray-900 text-white px-6 py-2"
        >
          Regisztráció folytatása
        </button>
        <div className="mt-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    );
  }

  // Show pre-registration error if present
  if (preRegError) {
    return (
      <div className="text-center">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{preRegError}</p>
        </div>
        <p className="text-gray-600 mb-4">
          Továbbra is regisztrálhatsz:
        </p>
        <button
          onClick={() => setPreRegError('')}
          className="btn bg-gray-900 text-white px-6 py-2"
        >
          Regisztráció folytatása
        </button>
        <div className="mt-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    );
  }

  // Show unified registration form
  const isInvitedEmployee = !!inviteData;

  // For pre-registration: similar to invite flow (simplified)
  const isPreRegistration = !!preRegData;

  // For invited employees: simple single-column layout
  if (isInvitedEmployee) {
    return (
      <div>
        <UnifiedRegisterForm inviteData={inviteData} preRegistrationData={null} />

        {/* Bottom links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            A regisztrációval elfogadod az{' '}
            <Link
              className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline"
              href="/terms"
            >
              Általános Szerződési Feltételeket
            </Link>{' '}
            és az{' '}
            <Link
              className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline"
              href="/privacy"
            >
              Adatvédelmi Nyilatkozatot
            </Link>
            .
          </p>
        </div>

        {/* Login link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Már van fiókod?{' '}
          <Link
            className="font-medium text-gray-900 underline hover:no-underline"
            href="/login"
          >
            Bejelentkezés
          </Link>
        </div>
      </div>
    );
  }

  // For normal registration: form stays centered, subtle left panel as background
  return (
    <div className="relative">
      <HideAuthHeader />

      {/* LEFT: Subtle background panel - fixed full-height (tablet and desktop) */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-[380px] bg-gradient-to-br from-gray-50 to-white border-r border-gray-100">
        <div className="pt-8 px-4">
          <ValuePropositionSection />
        </div>
      </div>

      {/* Mobile only: Collapsible value prop above form */}
      <div className="md:hidden mb-6 -mx-4 px-3 sm:px-4 py-5 sm:py-6 bg-gray-50/80 border-b border-gray-100">
        <ValuePropositionSection collapsible />
      </div>

      {/* CENTER: Form - stays in original centered position */}
      <UnifiedRegisterForm inviteData={inviteData} preRegistrationData={preRegData} />

      {/* Bottom links */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          A regisztrációval elfogadod az{' '}
          <Link
            className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline"
            href="/terms"
          >
            Általános Szerződési Feltételeket
          </Link>{' '}
          és az{' '}
          <Link
            className="whitespace-nowrap font-medium text-gray-700 underline hover:no-underline"
            href="/privacy"
          >
            Adatvédelmi Nyilatkozatot
          </Link>
          .
        </p>
      </div>

      {/* Login link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Már van fiókod?{' '}
        <Link
          className="font-medium text-gray-900 underline hover:no-underline"
          href="/login"
        >
          Bejelentkezés
        </Link>
      </div>

      {/* Footer - breaks out to full width, then offset for left panel on tablet/desktop */}
      <div
        className="mt-12 sm:mt-16 w-screen relative"
        style={{ marginLeft: 'calc(-50vw + 50%)' }}
      >
        {/* On tablet/desktop: footer in remaining space after left panel */}
        <div className="hidden md:block absolute left-[380px] right-0">
          <Footer border={true} />
        </div>
        {/* On mobile: full width footer */}
        <div className="md:hidden">
          <Footer border={true} />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterPageContent />
    </AuthProvider>
  );
}
