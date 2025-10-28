'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import RegisterForm from '@/components/auth/RegisterForm';
import { AccountTypeSelector, AccountType } from '@/components/auth/AccountTypeSelector';
import { CompanyRegisterForm } from '@/components/auth/CompanyRegisterForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  // Temporarily set to 'individual' - company registration disabled
  const [accountType, setAccountType] = useState<AccountType>('individual');

  // Get redirect URL from query params or default to dashboard
  const redirectTo = searchParams?.get('redirect_to') || '/dashboard';

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    if (user && !loading) {
      // Check if user is COMPANY_ADMIN or COMPANY_EMPLOYEE and redirect to company dashboard
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
  }, [user, loading, redirectTo, router]);

  const handleAuthSuccess = () => {
    console.log('[Register Page] Auth success, redirecting to:', redirectTo);
    router.push(redirectTo);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Átirányítás...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Vissza a főoldalra</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center space-x-2">
            <img
              src="/navbar-icon.png"
              alt="DMA logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-semibold text-gray-900">DMA</span>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Fiók létrehozása
            </h1>
            <p className="text-sm text-gray-600">
              Csatlakozz az DMA közösséghez
            </p>
          </div>

          {/* Form Content */}
          {/* Temporarily disabled - company registration
          {!accountType ? (
            // Show account type selector
            <AccountTypeSelector
              onSelect={(type) => setAccountType(type)}
              onBack={() => router.push('/login')}
            />
          ) : accountType === 'company' ? (
            // Company registration flow
            <CompanyRegisterForm
              onSuccess={handleAuthSuccess}
              onBack={() => setAccountType(null)}
            />
          ) : (
          */}
            {/* Individual registration flow - only option available */}
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => router.push('/login')}
              onBack={() => router.push('/login')}
              className="!p-0 !shadow-none !bg-transparent !border-0"
            />
          {/* End temporarily disabled */}
        </div>

        {/* Privacy Links */}
        <div className="mt-6 text-center text-xs text-gray-600">
          A folytatással elfogadod az{' '}
          <Link href="/terms" className="text-gray-900 hover:text-gray-700 underline">
            Általános Szerződési Feltételeket
          </Link>{' '}
          és az{' '}
          <Link href="/privacy" className="text-gray-900 hover:text-gray-700 underline">
            Adatvédelmi Nyilatkozatot
          </Link>
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
