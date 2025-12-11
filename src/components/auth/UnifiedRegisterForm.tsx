'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  Briefcase,
  Users,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { getAuthErrorMessage } from '@/hooks/useAuthQueries';

interface UnifiedRegistrationData {
  // Step 1: Personal info (all required)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Step 2: Optional company details
  companyName: string;
  billingEmail: string;
  industry: string;
  companySize: string;
}

interface UnifiedRegisterFormProps {
  inviteData?: {
    valid: boolean;
    companyName: string;
    employeeEmail: string;
    employeeName: string;
  } | null;
  onRegistrationComplete?: (userId: string, email: string) => void;
}

interface UnifiedRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  billingEmail?: string;
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

const industries = [
  'Technológia',
  'Pénzügy',
  'Egészségügy',
  'Oktatás',
  'Kereskedelem',
  'Marketing',
  'Gyártás',
  'Egyéb'
];

const companySizes = [
  '1-10 fő',
  '11-50 fő',
  '51-200 fő',
  '201-500 fő',
  '500+ fő'
];

export const UnifiedRegisterForm: React.FC<UnifiedRegisterFormProps> = ({
  inviteData,
  onRegistrationComplete
}) => {
  const router = useRouter();
  const step2Ref = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [formData, setFormData] = useState<UnifiedRegistrationData>({
    firstName: inviteData?.employeeName.split(' ')[0] || '',
    lastName: inviteData?.employeeName.split(' ').slice(1).join(' ') || '',
    email: inviteData?.employeeEmail || '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    billingEmail: '',
    industry: '',
    companySize: ''
  });

  const updateField = (field: keyof UnifiedRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = async (): Promise<boolean> => {
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
    if (!formData.phone.trim()) {
      setError('A telefonszám megadása kötelező');
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

    // Check if email is already in use (unless coming from invite)
    if (!inviteData) {
      setCheckingEmail(true);
      try {
        const checkEmail = httpsCallable<{ email: string }, { available: boolean; error?: string }>(
          functions,
          'checkEmailAvailability'
        );
        const result = await checkEmail({ email: formData.email.trim().toLowerCase() });
        if (!result.data.available) {
          setError('Ez az email cím már használatban van. Próbálj bejelentkezni vagy használj másik email címet.');
          setCheckingEmail(false);
          return false;
        }
      } catch (err) {
        console.error('Email check error:', err);
      }
      setCheckingEmail(false);
    }

    return true;
  };

  const validateStep2 = () => {
    // Step 2 is optional - only validate if fields are provided
    if (formData.billingEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      setError('Érvénytelen számlázási email cím');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError('');

    const isValid = await validateStep1();
    if (!isValid) return;

    // Move to Step 2
    setCurrentStep(2);

    // Smooth scroll to Step 2
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = async () => {
    setError('');

    // Validate Step 2 (optional fields)
    if (!validateStep2()) return;

    setLoading(true);

    console.log('[Unified Registration] Starting registration process...');
    console.log('[Unified Registration] Form data:', {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName || '(will use user name)',
      billingEmail: formData.billingEmail || '(will use registration email)',
      industry: formData.industry || '(not provided)',
      companySize: formData.companySize || '(not provided)'
    });

    try {
      // Step 1: Create Firebase Auth user
      console.log('[Unified Registration] Step 1: Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password
      );

      console.log('[Unified Registration] ✅ User created successfully:', userCredential.user.uid);

      // Update display name
      console.log('[Unified Registration] Step 2: Updating display name...');
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });

      console.log('[Unified Registration] ✅ Display name updated');

      // Step 3: Call Cloud Function to create company and user
      console.log('[Unified Registration] Step 3: Calling completeUnifiedRegistration...');

      const completeRegistration = httpsCallable<UnifiedRegistrationInput, UnifiedRegistrationResponse>(
        functions,
        'completeUnifiedRegistration'
      );

      const functionInput: UnifiedRegistrationInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        billingEmail: formData.billingEmail.trim(),
        industry: formData.industry,
        companySize: formData.companySize
      };

      console.log('[Unified Registration] Calling Cloud Function with input:', functionInput);

      const result = await completeRegistration(functionInput);

      console.log('[Unified Registration] ✅ Cloud Function returned:', result);

      if (result.data.success) {
        console.log('[Unified Registration] ✅ Registration successful');
        console.log('[Unified Registration] Company ID:', result.data.companyId);
        console.log('[Unified Registration] Linked to invite:', result.data.linkedToInvite);

        // CRITICAL: Force token refresh to pick up new custom claims
        console.log('[Unified Registration] Forcing token refresh to get custom claims...');
        await userCredential.user.getIdToken(true);
        await userCredential.user.reload();
        console.log('[Unified Registration] ✅ Token refreshed');

        // Notify parent component to show verification modal
        if (onRegistrationComplete) {
          console.log('[Unified Registration] Notifying parent component...');
          onRegistrationComplete(userCredential.user.uid, formData.email.trim());
        }

      } else {
        throw new Error('Registration failed: Cloud Function returned success: false');
      }

    } catch (err: any) {
      console.error('[Unified Registration] Error:', err);
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
    // Note: Don't set loading to false if successful - parent will handle the flow
  };

  return (
    <div className="space-y-8">
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

      {/* Step 1: Personal Information */}
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {inviteData ? 'Regisztráció és csatlakozás' : 'Regisztráció'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Töltsd ki az adataidat
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* First Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="firstName">
              Keresztnév
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="firstName"
                type="text"
                className="form-input w-full py-2.5 pl-10"
                placeholder="János"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lastName">
              Vezetéknév
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="lastName"
                type="text"
                className="form-input w-full py-2.5 pl-10"
                placeholder="Kovács"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
              Email cím
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                className={`form-input w-full py-2.5 pl-10 ${inviteData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="pelda@email.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                disabled={loading || !!inviteData}
                readOnly={!!inviteData}
              />
            </div>
            {inviteData && (
              <p className="mt-1 text-xs text-gray-500">
                A meghívóhoz tartozó email cím nem módosítható
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
              Telefonszám
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                className="form-input w-full py-2.5 pl-10"
                placeholder="+36 30 123 4567"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
              Jelszó
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input w-full py-2.5 pl-10 pr-10"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
              Jelszó megerősítése
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input w-full py-2.5 pl-10 pr-10"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Next Button */}
          {currentStep === 1 && (
            <motion.button
              type="button"
              onClick={handleNext}
              disabled={loading || checkingEmail}
              className="w-full py-3 px-6 bg-gradient-to-t from-brand-secondary to-brand-secondary/50 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ellenőrzés...
                </>
              ) : (
                <>
                  Tovább
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Step 2: Optional Company Details */}
      {currentStep === 2 && (
        <motion.div
          ref={step2Ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pt-8 border-t border-gray-200"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Vállalati adatok (opcionális)
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ezeket később is megadhatod
            </p>
          </div>

          <div className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="companyName">
                Cégnév <span className="text-gray-400 font-normal">(opcionális)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="companyName"
                  type="text"
                  className="form-input w-full py-2.5 pl-10"
                  placeholder="Ha üresen hagyod, a neved lesz használva"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Billing Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="billingEmail">
                Számlázási email <span className="text-gray-400 font-normal">(opcionális)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="billingEmail"
                  type="email"
                  className="form-input w-full py-2.5 pl-10"
                  placeholder="Ha üresen hagyod, a regisztrációs email lesz használva"
                  value={formData.billingEmail}
                  onChange={(e) => updateField('billingEmail', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="industry">
                Iparág <span className="text-gray-400 font-normal">(opcionális)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="industry"
                  className="form-input w-full py-2.5 pl-10 appearance-none"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Válassz iparágat...</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="companySize">
                Cég mérete <span className="text-gray-400 font-normal">(opcionális)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="companySize"
                  className="form-input w-full py-2.5 pl-10 appearance-none"
                  value={formData.companySize}
                  onChange={(e) => updateField('companySize', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Válassz méretet...</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Vissza
              </button>

              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 py-3 px-6 bg-gradient-to-t from-brand-secondary to-brand-secondary/50 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Regisztráció...
                  </>
                ) : (
                  'Regisztráció befejezése'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
