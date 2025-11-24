'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Building2, Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface VerifyInviteResponse {
  valid: boolean;
  companyName: string;
  employeeEmail: string;
  employeeName: string;
  expired?: boolean;
}

interface AcceptInviteResponse {
  success: boolean;
  companyId: string;
}

export default function InviteAcceptancePage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<VerifyInviteResponse | null>(null);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  const token = params.token as string;

  // 🔍 DIAGNOSTIC: Log page mount
  console.log('🎫 [INVITE PAGE] Mounted', {
    token: token?.substring(0, 10) + '...',
    hasUser: !!user,
    userEmail: user?.email,
    authLoading,
  });

  // Verify invitation token on mount
  useEffect(() => {
    const verifyInvite = async () => {
      console.log('🔍 [INVITE PAGE] Calling verifyEmployeeInvite...', { token: token?.substring(0, 10) + '...' });
      try {
        const verify = httpsCallable<{ token: string }, VerifyInviteResponse>(
          functions,
          'verifyEmployeeInvite'
        );

        const result = await verify({ token });
        console.log('✅ [INVITE PAGE] verifyEmployeeInvite result:', result.data);

        if (result.data.valid) {
          setInviteData(result.data);
        } else if (result.data.expired) {
          setError('Ez a meghívó lejárt. Kérj új meghívót a cég adminisztrátorától.');
        } else {
          setError('Érvénytelen meghívó link');
        }
      } catch (err: any) {
        console.error('❌ [INVITE PAGE] Error verifying invite:', err);

        if (err.code === 'not-found') {
          setError('Ez a meghívó nem található vagy már fel lett használva');
        } else {
          setError('Hiba történt a meghívó ellenőrzése során');
        }
      } finally {
        setVerifying(false);
      }
    };

    if (token) {
      verifyInvite();
    } else {
      setError('Hiányzó meghívó kód');
      setVerifying(false);
    }
  }, [token]);

  const handleAcceptInvite = async () => {
    console.log('🎯 [INVITE PAGE] handleAcceptInvite called', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.uid,
      token: token?.substring(0, 10) + '...',
    });

    if (!user) {
      console.log('⚠️ [INVITE PAGE] No user, redirecting to login with redirect_to');
      // Redirect to login with return URL
      router.push(`/login?redirect_to=/company/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError('');

    console.log('📤 [INVITE PAGE] Calling acceptEmployeeInvite Cloud Function...');
    try {
      const accept = httpsCallable<{ token: string }, AcceptInviteResponse>(
        functions,
        'acceptEmployeeInvite'
      );

      const result = await accept({ token });
      console.log('✅ [INVITE PAGE] acceptEmployeeInvite result:', result.data);

      if (result.data.success) {
        setAccepted(true);
        console.log('🎉 [INVITE PAGE] Invite accepted successfully, redirecting to dashboard...');

        // Redirect employees to their personal dashboard (not company dashboard)
        // They'll see courses there with company badge
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      console.error('❌ [INVITE PAGE] Error accepting invite:', err);

      if (err.code === 'unauthenticated') {
        router.push(`/login?redirect_to=/company/invite/${token}`);
      } else if (err.code === 'failed-precondition') {
        setError('Ez a meghívó már fel lett használva');
      } else if (err.code === 'not-found') {
        setError('A meghívó nem található');
      } else {
        setError(err.message || 'Hiba történt a meghívó elfogadása során');
      }
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Meghívó ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Sikeres csatlakozás!
          </h2>
          <p className="text-gray-600 mb-4">
            Mostantól a <strong>{inviteData?.companyName}</strong> vállalat tagja vagy.
          </p>
          <p className="text-sm text-gray-500">
            Átirányítás a kurzusaidhoz...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mx-auto mt-4"></div>
        </motion.div>
      </div>
    );
  }

  if (error || !inviteData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {error || 'Érvénytelen meghívó'}
          </h2>
          <p className="text-gray-600 mb-6">
            Ha úgy gondolod, hogy ez hiba, kérj új meghívót a cég adminisztrátorától.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center space-x-2">
            <img
              src="/dma-logo-dark.svg"
              alt="DMA Logo"
              className="h-8"
              onError={(e) => {
                e.currentTarget.src = '/logo.png';
              }}
            />
          </Link>
        </div>

        {/* Invitation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8"
        >
          {/* Company Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Csatlakozz a csapathoz!
            </h1>
          </div>

          {/* Invitation Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vállalat</p>
                <p className="text-lg font-semibold text-gray-900">{inviteData.companyName}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-1">Meghívott munkatárs</p>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{inviteData.employeeEmail}</p>
                </div>
                <p className="text-base font-medium text-gray-900 mt-2">{inviteData.employeeName}</p>
              </div>
            </div>
          </div>

          {/* Auth Status */}
          {!user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                A meghívó elfogadásához először be kell jelentkezned vagy regisztrálnod kell.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Bejelentkezve</p>
                <p className="text-xs text-green-700 mt-1">{user.email}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                <>
                  {user ? 'Meghívó elfogadása' : 'Bejelentkezés és elfogadás'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            <Link
              href="/"
              className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Mégse
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              A meghívó elfogadásával hozzáférést kapsz a vállalat által biztosított képzésekhez
              és erőforrásokhoz az DMA platformon.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
