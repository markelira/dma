'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { AccountTypeSelector, AccountType } from '@/components/auth/AccountTypeSelector';
import { CompanyRegisterForm } from '@/components/auth/CompanyRegisterForm';
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import Link from 'next/link';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, register: registerUser } = useAuth();

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  // Get redirect URL from query params or default to dashboard
  const redirectTo = searchParams?.get('redirect_to') || '/dashboard';

  // Set flag when company account type is selected
  useEffect(() => {
    if (accountType === 'company') {
      setIsCompanyRegistering(true);
    }
  }, [accountType]);

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    // BUT: Don't redirect if we're in the middle of company registration
    // (CompanyRegisterForm handles its own redirect after claims propagate)
    if (user && !authLoading && !isCompanyRegistering) {
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
  }, [user, authLoading, redirectTo, router, isCompanyRegistering]);

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
      const userCredential = await registerUser(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      console.log('[Register Page] Auth success, sending verification code');

      // Store user ID for verification modal
      setRegisteredUserId(userCredential.user.uid);

      // Send verification code
      try {
        const sendEmailVerificationCode = httpsCallable(functions, 'sendEmailVerificationCode');
        const result = await sendEmailVerificationCode({}) as any;

        if (result.data.success) {
          console.log('[Register Page] Verification code sent successfully');

          // In emulator mode, log the code for testing
          if (result.data.code) {
            console.log('🔐 VERIFICATION CODE (emulator):', result.data.code);
          }

          // Show verification modal (hard block)
          setShowVerificationModal(true);
        } else {
          console.error('[Register Page] Failed to send verification code:', result.data.error);
          // Still show modal - user can try resend
          setShowVerificationModal(true);
        }
      } catch (emailError) {
        console.error('[Register Page] Error sending verification code:', emailError);
        // Still show modal - user can try resend
        setShowVerificationModal(true);
      }
    } catch (err: any) {
      console.error('Registration error:', err);

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

  if (authLoading) {
    return null; // Auth layout will handle the loading state
  }

  // If user is authenticated, show nothing (will redirect)
  if (user) {
    return null;
  }

  // Show account type selector if no type selected
  if (!accountType) {
    return (
      <AccountTypeSelector
        onSelect={(type) => setAccountType(type)}
        onBack={() => router.push('/login')}
      />
    );
  }

  // Show company registration form if company type selected
  if (accountType === 'company') {
    return (
      <CompanyRegisterForm
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
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => setAccountType(null)}
          className="text-sm text-gray-700 hover:text-gray-900 flex items-center"
          type="button"
        >
          ← Vissza a fiók típushoz
        </button>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-bold">Fiók létrehozása</h1>
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
              htmlFor="email"
            >
              Email cím
            </label>
            <input
              id="email"
              name="email"
              className="form-input w-full py-2"
              type="email"
              placeholder="pelda@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              Jelszó
            </label>
            <input
              id="password"
              name="password"
              className="form-input w-full py-2"
              type="password"
              autoComplete="on"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%]"
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

      {/* Email Verification Modal */}
      {showVerificationModal && registeredUserId && (
        <EmailVerificationModal
          email={formData.email}
          userId={registeredUserId}
          onVerified={() => {
            console.log('[Register Page] Email verified, redirecting to:', redirectTo);
            setShowVerificationModal(false);
            router.push(redirectTo);
          }}
        />
      )}
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
