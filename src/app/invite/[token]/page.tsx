'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Users, Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface AcceptTeamInviteResponse {
  success: boolean;
  teamId?: string;
  teamName?: string;
  message?: string;
  error?: string;
}

export default function TeamInviteAcceptancePage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [teamName, setTeamName] = useState('');

  const token = params.token as string;

  // If user is not logged in, redirect to login with return URL
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect_to=/invite/${token}`);
    }
  }, [authLoading, user, router, token]);

  const handleAcceptInvite = async () => {
    if (!user) {
      router.push(`/login?redirect_to=/invite/${token}`);
      return;
    }

    setAccepting(true);
    setError('');

    try {
      const accept = httpsCallable<{ inviteToken: string }, AcceptTeamInviteResponse>(
        functions,
        'acceptTeamInvite'
      );

      const result = await accept({ inviteToken: token });

      if (result.data.success) {
        setAccepted(true);
        setTeamName(result.data.teamName || 'a csapat');

        // Refresh user data to get updated teamId
        await refreshUser();

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(result.data.error || 'Hiba történt a meghívó elfogadása során');
      }
    } catch (err: any) {
      console.error('Error accepting team invite:', err);

      if (err.code === 'functions/unauthenticated') {
        router.push(`/login?redirect_to=/invite/${token}`);
      } else if (err.message?.includes('expired')) {
        setError('Ez a meghívó lejárt. Kérj új meghívót a csapat tulajdonosától.');
      } else if (err.message?.includes('not found') || err.message?.includes('No member found')) {
        setError('Ez a meghívó nem található vagy már fel lett használva.');
      } else if (err.message?.includes('already in')) {
        setError('Már tag vagy egy másik csapatban. Egy felhasználó csak egy csapat tagja lehet.');
      } else if (err.message?.includes('subscription')) {
        setError('A csapat előfizetése nem aktív. Kérjük, lépj kapcsolatba a csapat tulajdonosával.');
      } else {
        setError(err.message || 'Hiba történt a meghívó elfogadása során');
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvite = async () => {
    try {
      const decline = httpsCallable<{ inviteToken: string }, { success: boolean }>(
        functions,
        'declineTeamInvite'
      );

      await decline({ inviteToken: token });
      router.push('/');
    } catch (err) {
      console.error('Error declining invite:', err);
      router.push('/');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Betöltés...</p>
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
            Mostantól <strong>{teamName}</strong> tagja vagy.
          </p>
          <p className="text-gray-600 mb-4">
            Hozzáférsz az összes tartalomhoz a csapat előfizetésén keresztül.
          </p>
          <p className="text-sm text-gray-500">
            Átirányítás a vezérlőpultra...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mx-auto mt-4"></div>
        </motion.div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Hiányzó meghívó kód
          </h2>
          <p className="text-gray-600 mb-6">
            Kérjük, használd a meghívó emailben kapott linket.
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
              src="/images/navbar-logo.png"
              alt="DMA Logo"
              className="h-8"
            />
            <span className="text-xl font-bold text-gray-900">DMA</span>
          </Link>
        </div>

        {/* Invitation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8"
        >
          {/* Team Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Csatlakozz a csapathoz!
            </h1>
            <p className="text-gray-600">
              Meghívtak, hogy csatlakozz egy csapat előfizetéshez.
            </p>
          </div>

          {/* Auth Status */}
          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Bejelentkezve</p>
                <p className="text-xs text-green-700 mt-1">{user.email}</p>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Mit kapsz csapattagként:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                Hozzáférés az összes tartalomhoz
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                Korlátlan tanulási lehetőség
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                Tanúsítványok megszerzése
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                <>
                  Meghívó elfogadása
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>

            <button
              onClick={handleDeclineInvite}
              disabled={accepting}
              className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Elutasítás
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              A meghívó elfogadásával hozzáférést kapsz a csapat előfizetéséhez tartozó
              összes tartalomhoz és tananyaghoz.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
