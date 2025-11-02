'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle, AlertCircle, X } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Check for email verification success
  const verifiedParam = searchParams?.get('verified');
  const emailParam = searchParams?.get('email');
  const isVerified = verifiedParam === 'true';

  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(isVerified);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Get redirect URL from query params or default to dashboard
  const redirectTo = searchParams?.get('redirect_to') || '/dashboard';

  useEffect(() => {
    // If user is already authenticated, redirect
    if (user && !authLoading) {
      console.log('[Login Page] User authenticated, redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [user, authLoading, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Login Page] Auth success, redirecting to:', redirectTo);
      router.push(redirectTo);
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Hibás email cím vagy jelszó');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Túl sok sikertelen próbálkozás. Kérjük, próbálja újra később.');
      } else {
        setError('Bejelentkezési hiba történt. Kérjük, próbálja újra.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);

    if (!forgotEmail) {
      setForgotError('Kérjük, add meg az email címed.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError('Kérjük, adj meg egy érvényes email címet.');
      return;
    }

    setForgotLoading(true);

    try {
      const requestPasswordReset = httpsCallable(functions, 'requestPasswordReset');
      const result = await requestPasswordReset({ email: forgotEmail }) as any;

      if (result.data.success) {
        setForgotSuccess(true);
        setForgotEmail('');
      } else {
        setForgotError(result.data.message || 'Hiba történt a jelszó visszaállítási kérelem során.');
      }
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setForgotError('Hiba történt a jelszó visszaállítási kérelem során. Kérjük, próbáld újra később.');
    } finally {
      setForgotLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setForgotError('');
    setForgotSuccess(false);
    if (showForgotPassword) {
      setForgotEmail('');
    }
  };

  if (authLoading) {
    return null; // Auth layout will handle the loading state
  }

  // If user is authenticated, show nothing (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Jelentkezz be a fiókodba</h1>
      </div>

      {/* Email Verification Success Message */}
      <AnimatePresence>
        {showVerificationSuccess && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Email megerősítve!
                  </p>
                  <p className="text-sm text-green-800">
                    Az email címed sikeresen megerősítettük. Most már bejelentkezhetsz a fiókodba.
                  </p>
                </div>
                <button
                  onClick={() => setShowVerificationSuccess(false)}
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              htmlFor="email"
            >
              Email cím
            </label>
            <input
              id="email"
              className="form-input w-full py-2"
              type="email"
              placeholder="pelda@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="form-input w-full py-2"
              type="password"
              autoComplete="on"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </div>
      </form>

      {/* Forgot Password Link/Dropdown */}
      <div className="mt-6">
        <div className="text-center">
          <button
            type="button"
            onClick={toggleForgotPassword}
            className="text-sm text-gray-700 underline hover:no-underline"
          >
            Elfelejtett jelszó?
          </button>
        </div>

        {/* Forgot Password Dropdown */}
        <AnimatePresence>
          {showForgotPassword && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-6 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Jelszó visszaállítás
                  </h3>
                  <button
                    onClick={toggleForgotPassword}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!forgotSuccess ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label
                        className="mb-1 block text-sm font-medium text-gray-700"
                        htmlFor="forgot-email"
                      >
                        Email cím
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          id="forgot-email"
                          className="form-input w-full py-2 pl-10"
                          type="email"
                          placeholder="pelda@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          disabled={forgotLoading}
                        />
                      </div>
                    </div>

                    {forgotError && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{forgotError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm hover:shadow-md transition-all"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? 'Küldés...' : 'Visszaállítási link küldése'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 rounded-lg bg-green-50 p-4 border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Email elküldve!</p>
                        <p>Ha a megadott email cím regisztrálva van, küldtünk egy jelszó visszaállítási linket. Kérjük, ellenőrizd az email fiókodat (a spam mappát is).</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setForgotSuccess(false);
                        setForgotEmail('');
                      }}
                      className="btn w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Új link kérése
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Register link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Még nincs fiókod?{' '}
        <Link
          className="font-medium text-gray-900 underline hover:no-underline"
          href="/register"
        >
          Regisztrálj itt
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}
