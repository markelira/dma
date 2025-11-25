'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  onBack?: () => void;
  className?: string;
}

export default function RegisterForm({
  onSuccess,
  onSwitchToLogin,
  onBack,
  className = ''
}: RegisterFormProps) {
  const { register: registerUser, loginWithGoogle, loading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      setError('A keresztnév legalább 2 karakter hosszú kell legyen');
      return false;
    }
    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      setError('A vezetéknév legalább 2 karakter hosszú kell legyen');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Érvényes email címet adj meg');
      return false;
    }
    if (formData.password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('A jelszavak nem egyeznek');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || loading) return;

    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      onSuccess?.();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (isSubmitting || loading) return;

    setError('');
    setIsSubmitting(true);

    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      console.error('Google registration error:', err);
      setError('Google regisztráció sikertelen. Kérjük, próbálja újra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Keresztnév</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="János"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isSubmitting || loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Vezetéknév</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Kovács"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isSubmitting || loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email cím</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="pelda@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting || loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Jelszó</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting || loading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting || loading}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Regisztráció...
            </>
          ) : (
            'Fiók létrehozása'
          )}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Vagy</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleRegister}
          disabled={isSubmitting || loading}
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google-lal regisztráció
        </Button>

        {onSwitchToLogin && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Már van fiókod?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-brand-secondary hover:underline font-medium"
              disabled={isSubmitting || loading}
            >
              Bejelentkezés
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
