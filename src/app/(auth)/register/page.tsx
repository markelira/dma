'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { AccountTypeSelector, AccountType } from '@/components/auth/AccountTypeSelector';
import { CompanyRegisterForm } from '@/components/auth/CompanyRegisterForm';
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase';
import Link from 'next/link';
import { Building2, Eye, EyeOff } from 'lucide-react';

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

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompanyRegistering, setIsCompanyRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Employee invite handling
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Get params from URL
  const redirectTo = searchParams?.get('redirect_to') || '/dashboard';
  const inviteToken = searchParams?.get('invite');
  const inviteEmail = searchParams?.get('email');

  // Set flag when company account type is selected
  useEffect(() => {
    if (accountType === 'company') {
      setIsCompanyRegistering(true);
    }
  }, [accountType]);

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
          // Prefill email from invite data (more reliable than URL param)
          setFormData(prev => ({
            ...prev,
            email: result.data.employeeEmail,
            firstName: result.data.employeeName.split(' ')[0] || '',
            lastName: result.data.employeeName.split(' ').slice(1).join(' ') || '',
          }));
          // Auto-select individual account type for employee invites
          setAccountType('individual');
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
          if (inviteEmail) {
            setFormData(prev => ({ ...prev, email: decodeURIComponent(inviteEmail) }));
          }
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
        setFormData(prev => ({ ...prev, email: data.email }));
        setIsVerifying(true);
        setShowVerificationModal(true);
      } catch (err) {
        console.error('[Register Page] Error parsing pending verification:', err);
        sessionStorage.removeItem('pendingEmailVerification');
      }
    }
  }, []); // Run once on mount

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    // BUT: Don't redirect if we're in the middle of company registration OR email verification
    // (CompanyRegisterForm handles its own redirect after claims propagate)
    // (EmailVerificationModal handles redirect after verification)

    // Also check sessionStorage for pending verification - don't redirect if pending
    const pendingVerification = sessionStorage.getItem('pendingEmailVerification');

    if (user && !authLoading && !isCompanyRegistering && !isVerifying && !pendingVerification) {
      if (user.role === 'company_admin' || user.role === 'COMPANY_ADMIN') {
        console.log('[Register Page] COMPANY_ADMIN user authenticated, redirecting to /company/dashboard');
        router.push('/company/dashboard');
      } else if (user.role === 'company_employee' || user.role === 'COMPANY_EMPLOYEE') {
        console.log('[Register Page] COMPANY_EMPLOYEE user authenticated, redirecting to /company/dashboard');
        router.push('/company/dashboard');
      } else {
        console.log('[Register Page] User authenticated, redirecting to:', redirectTo);
        router.push(redirectTo);
      }
    }
  }, [user, authLoading, redirectTo, router, isCompanyRegistering, isVerifying]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      setError('A keresztnév legalább 2 karakter hosszú kell legyen');
      setLoading(false);
      return;
    }
    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      setError('A vezetéknév legalább 2 karakter hosszú kell legyen');
      setLoading(false);
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Érvényes email címet adj meg');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
      setLoading(false);
      return;
    }

    try {
      // Set verifying flag to prevent auto-redirect
      setIsVerifying(true);

      const userCredential = await registerUser(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      console.log('[Register Page] Auth success');
      console.log('[Register Page] User ID:', userCredential.user.uid);
      console.log('[Register Page] Email:', formData.email);

      // Store user ID for verification modal
      setRegisteredUserId(userCredential.user.uid);

      // Save to sessionStorage BEFORE showing modal (survives page refresh)
      sessionStorage.setItem('pendingEmailVerification', JSON.stringify({
        userId: userCredential.user.uid,
        email: formData.email
      }));
      console.log('[Register Page] Saved pending verification to sessionStorage');

      // Show verification modal IMMEDIATELY - don't wait for email
      console.log('[Register Page] Showing verification modal instantly');
      setShowVerificationModal(true);

      // Send verification email in BACKGROUND (fire and forget)
      const sendEmailVerificationCode = httpsCallable(functions, 'sendEmailVerificationCode');
      sendEmailVerificationCode({})
        .then((result: any) => {
          console.log('[Register Page] Verification email sent in background:', result.data);
          if (result.data.code) {
            console.log('🔐 VERIFICATION CODE (emulator):', result.data.code);
          }
        })
        .catch((emailError: any) => {
          console.error('[Register Page] Background email send failed:', emailError);
          // User can use "resend" button in modal if needed
        });
    } catch (err: any) {
      console.error('Registration error:', err);

      // Reset verification flag on error
      setIsVerifying(false);

      if (err.code === 'auth/email-already-in-use') {
        setError('Ez az email cím már használatban van');
      } else if (err.code === 'auth/invalid-email') {
        setError('Érvénytelen email cím');
      } else if (err.code === 'auth/weak-password') {
        setError('A jelszó túl gyenge');
      } else {
        setError('Regisztráció sikertelen. Kérjük, próbálja újra.');
      }
      setLoading(false);
    }
    // Note: Don't set loading to false if verification modal is shown
    // The modal will handle the flow
  };

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
    console.log('[Register Page] Modal state - email:', formData.email);
    console.log('[Register Page] Modal state - accountType:', accountType);

    return (
      <EmailVerificationModal
        email={formData.email}
        userId={registeredUserId}
        onVerified={async () => {
          console.log('[Register Page] Email verified successfully');

          // Clear pending verification from sessionStorage
          sessionStorage.removeItem('pendingEmailVerification');
          console.log('[Register Page] Cleared pending verification from sessionStorage');

          // Set flag for welcome popup on first dashboard visit
          sessionStorage.setItem('showWelcomePopup', 'true');
          console.log('[Register Page] Set welcome popup flag');

          setIsVerifying(false);
          setShowVerificationModal(false);

          // Force token refresh to pick up emailVerified: true
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log('[Register Page] Refreshing token for auto-login');
            await currentUser.getIdToken(true);
          }

          // Redirect directly to dashboard (user stays logged in)
          console.log('[Register Page] Email verified, redirecting directly to:', redirectTo);
          router.push(redirectTo);
        }}
      />
    );
  }

  // Show account type selector if no type selected (and no invite)
  if (!accountType && !inviteToken) {
    return (
      <AccountTypeSelector
        onSelect={(type) => setAccountType(type)}
        onBack={() => router.push('/login')}
      />
    );
  }

  // Show invite error if present
  if (inviteError && !accountType) {
    return (
      <div className="text-center">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{inviteError}</p>
        </div>
        <p className="text-gray-600 mb-4">
          Továbbra is regisztrálhatsz egyéni fiókkal:
        </p>
        <button
          onClick={() => setAccountType('individual')}
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

  // Show company registration form if company type selected
  if (accountType === 'company') {
    return (
      <CompanyRegisterForm
        onVerificationStart={() => {
          console.log('[Register Page] Company verification starting');
          // Set isVerifying flag to prevent any redirects during verification
          setIsVerifying(true);
        }}
        onRegistrationComplete={(userId: string, email: string) => {
          console.log('[Register Page] Company registration complete, showing verification modal');
          console.log('[Register Page] User ID:', userId);
          console.log('[Register Page] Email:', email);

          // Store the userId and email for modal
          setRegisteredUserId(userId);
          setFormData(prev => ({ ...prev, email }));

          // Save to sessionStorage (survives page refresh)
          sessionStorage.setItem('pendingEmailVerification', JSON.stringify({
            userId,
            email
          }));

          // Show verification modal
          setShowVerificationModal(true);
        }}
        onSuccess={() => {
          console.log('[Register Page] Company registration success');
          // CompanyRegisterForm handles its own redirect to /company/dashboard
          // Keep isCompanyRegistering=true to prevent register page redirect
        }}
        onBack={() => {
          setAccountType(null);
          setIsCompanyRegistering(false);
        }}
      />
    );
  }

  // Show individual registration form (accountType === 'individual')
  return (
    <>
      {/* Back button - hide when invited */}
      {!inviteData && (
        <div className="mb-6">
          <button
            onClick={() => setAccountType(null)}
            className="text-sm text-gray-700 hover:text-gray-900 flex items-center"
            type="button"
          >
            ← Vissza a fiók típushoz
          </button>
        </div>
      )}

      {/* Company Invite Banner */}
      {inviteData && (
        <div className="mb-6 p-4 bg-brand-secondary/5 border border-brand-secondary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-secondary/10 rounded-full">
              <Building2 className="w-5 h-5 text-brand-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-secondary-hover">
                Csatlakozás: {inviteData.companyName}
              </p>
              <p className="text-xs text-brand-secondary-hover">
                Regisztrálj, hogy hozzáférj a cég tartalmaihoz
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          {inviteData ? 'Regisztráció és csatlakozás' : 'Regisztráció'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="lastName"
            >
              Vezetéknév
            </label>
            <input
              id="lastName"
              name="lastName"
              className="form-input w-full py-2"
              type="text"
              placeholder="Kovács"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="firstName"
            >
              Keresztnév
            </label>
            <input
              id="firstName"
              name="firstName"
              className="form-input w-full py-2"
              type="text"
              placeholder="János"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Email cím
            </label>
            <input
              id="email"
              name="email"
              className={`form-input w-full py-2 ${inviteData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              type="email"
              placeholder="pelda@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading || !!inviteData}
              readOnly={!!inviteData}
            />
            {inviteData && (
              <p className="mt-1 text-xs text-gray-500">
                A meghívóhoz tartozó email cím nem módosítható
              </p>
            )}
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              Jelszó
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                className="form-input w-full py-2 pr-10"
                type={showPassword ? 'text' : 'password'}
                autoComplete="on"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="btn w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%]"
            disabled={loading}
          >
            {loading ? 'Regisztráció...' : 'Regisztráció'}
          </button>
        </div>
      </form>

      {/* Bottom link */}
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
