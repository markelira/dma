'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { UnifiedRegisterForm } from '@/components/auth/UnifiedRegisterForm';
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { getAuthErrorMessage } from '@/hooks/useAuthQueries';
import { getDashboardPath } from '@/lib/routing';
import { updateAuthStoreFromFirebase } from '@/stores/authStore';

interface UnifiedRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  billingEmail: string;
  industry?: string;
  companySize?: string;
}

interface UnifiedRegistrationResponse {
  success: boolean;
  companyId: string;
  userId: string;
  linkedToInvite?: boolean;
  message?: string;
}

interface AddEmployeeInput {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AddEmployeeResponse {
  success: boolean;
  inviteId?: string;
  message?: string;
}

interface InviteData {
  valid: boolean;
  companyName: string;
  employeeEmail: string;
  employeeName: string;
  expired?: boolean;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, register: registerUser, logout } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Employee invite handling
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Get params from URL (redirectTo is kept for potential future use but not currently used)
  const redirectToParam = searchParams?.get('redirect_to');
  const inviteToken = searchParams?.get('invite');
  const inviteEmail = searchParams?.get('email');


  // Verify invite token and prefill email when present
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
          // User can register normally and linkEmployeeByEmail will try to match by email
          console.log('[Register] Invite verification failed, allowing normal registration');
        }
      } finally {
        setInviteLoading(false);
      }
    };

    verifyInvite();
  }, [inviteToken, inviteEmail]);

  // Check for pending email verification on mount (survives page refresh)
  useEffect(() => {
    const pendingVerification = sessionStorage.getItem('pendingEmailVerification');
    if (pendingVerification && !showVerificationModal && !isVerifying) {
      try {
        const data = JSON.parse(pendingVerification);
        console.log('[Register Page] Found pending verification in sessionStorage:', data);
        setRegisteredUserId(data.userId);
        setRegisteredEmail(data.email);
        setIsVerifying(true);
        setShowVerificationModal(true);
      } catch (err) {
        console.error('[Register Page] Error parsing pending verification:', err);
        sessionStorage.removeItem('pendingEmailVerification');
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    // If user is already authenticated, redirect to appropriate dashboard
    // Don't redirect if we're verifying email
    const pendingVerification = sessionStorage.getItem('pendingEmailVerification');

    if (user && !authLoading && !isVerifying && !pendingVerification) {
      const dashboardPath = getDashboardPath((user as any)?.role);
      console.log('[Register Page] User authenticated, redirecting to', dashboardPath);
      router.push(dashboardPath);
    }
  }, [user, authLoading, router, isVerifying]);


  if (authLoading || inviteLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">
            {inviteLoading ? 'Meghívó ellenőrzése...' : 'Betöltés...'}
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show nothing (will redirect)
  // EXCEPT when we're showing the verification modal
  if (user && !showVerificationModal) {
    return null;
  }

  // If showing verification modal, only render the modal
  if (showVerificationModal && registeredUserId) {
    console.log('[Register Page] Rendering EmailVerificationModal component');
    console.log('[Register Page] Modal state - showVerificationModal:', showVerificationModal);
    console.log('[Register Page] Modal state - registeredUserId:', registeredUserId);
    console.log('[Register Page] Modal state - email:', registeredEmail);

    return (
      <EmailVerificationModal
        email={registeredEmail}
        userId={registeredUserId}
        onCancel={async () => {
          console.log('[Register Page] User cancelled verification');

          // Clear pending verification from sessionStorage
          sessionStorage.removeItem('pendingEmailVerification');

          // Reset state
          setIsVerifying(false);
          setShowVerificationModal(false);
          setRegisteredUserId(null);
          setRegisteredEmail('');

          // Log out the user
          try {
            await logout();
            console.log('[Register Page] User logged out after cancellation');
          } catch (err) {
            console.error('[Register Page] Error logging out:', err);
          }

          // Redirect to login
          router.push('/login');
        }}
        onVerified={async () => {
          console.log('[Register Page] Email verified successfully');

          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.error('[Register Page] No current user after verification');
            router.push('/login');
            return;
          }

          // Get pending registration data from sessionStorage
          const pendingDataStr = sessionStorage.getItem('pendingRegistrationData');

          if (pendingDataStr) {
            try {
              const pendingData = JSON.parse(pendingDataStr);
              console.log('[Register Page] Found pending registration data, completing registration...');

              // NOW call completeUnifiedRegistration to create Firestore documents
              const completeRegistration = httpsCallable<UnifiedRegistrationInput, UnifiedRegistrationResponse>(
                functions,
                'completeUnifiedRegistration'
              );

              const result = await completeRegistration({
                firstName: pendingData.firstName,
                lastName: pendingData.lastName,
                email: pendingData.email,
                phone: pendingData.phone,
                companyName: pendingData.companyName,
                billingEmail: pendingData.billingEmail,
                industry: pendingData.industry,
                companySize: pendingData.companySize
              });

              console.log('[Register Page] ✅ Registration completed:', result.data);

              if (result.data.success) {
                // Send employee invites if any were added
                if (pendingData.pendingEmployees && pendingData.pendingEmployees.length > 0) {
                  console.log('[Register Page] Sending employee invites:', pendingData.pendingEmployees.length);
                  const addEmployee = httpsCallable<AddEmployeeInput, AddEmployeeResponse>(functions, 'addEmployee');

                  for (const employee of pendingData.pendingEmployees) {
                    addEmployee({
                      companyId: result.data.companyId,
                      email: employee.email,
                      firstName: employee.firstName,
                      lastName: employee.lastName
                    }).then(() => {
                      console.log(`[Register Page] ✅ Invite sent to ${employee.email}`);
                    }).catch((inviteError: any) => {
                      console.error(`[Register Page] ⚠️ Failed to invite ${employee.email}:`, inviteError);
                    });
                  }
                }

                // Force token refresh to pick up new custom claims
                await currentUser.getIdToken(true);
                await currentUser.reload();
                console.log('[Register Page] ✅ Token refreshed');

                // Update Zustand store with fresh custom claims
                await updateAuthStoreFromFirebase(currentUser);
                console.log('[Register Page] ✅ Store updated');
              }

              // Clear pending data
              sessionStorage.removeItem('pendingRegistrationData');
            } catch (err) {
              console.error('[Register Page] Error completing registration:', err);
              // Still continue to clear state and redirect
            }
          }

          // Clear pending verification from sessionStorage
          sessionStorage.removeItem('pendingEmailVerification');
          console.log('[Register Page] Cleared pending verification from sessionStorage');

          setIsVerifying(false);
          setShowVerificationModal(false);

          // Check if this is an invited employee (they don't need to pay)
          if (inviteData) {
            console.log('[Register Page] Invited employee - redirecting to dashboard (no payment required)');
            router.push('/dashboard');
          } else {
            // Regular registration - redirect to company dashboard (popup will show there)
            console.log('[Register Page] Redirecting new user to company dashboard');
            router.push('/company/dashboard');
          }
        }}
      />
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

  // Show unified registration form
  return (
    <>
      <UnifiedRegisterForm
        inviteData={inviteData}
        onRegistrationComplete={(userId: string, email: string) => {
          console.log('[Register Page] Registration complete, showing verification modal');
          console.log('[Register Page] User ID:', userId);
          console.log('[Register Page] Email:', email);

          // Store the userId and email for modal
          setRegisteredUserId(userId);
          setRegisteredEmail(email);

          // Save to sessionStorage (survives page refresh)
          sessionStorage.setItem('pendingEmailVerification', JSON.stringify({
            userId,
            email
          }));

          // Set verifying flag to prevent redirect
          setIsVerifying(true);

          // Show verification modal
          setShowVerificationModal(true);
        }}
      />

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
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterPageContent />
    </AuthProvider>
  );
}
