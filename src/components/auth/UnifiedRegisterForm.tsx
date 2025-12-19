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
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  X
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { getAuthErrorMessage } from '@/hooks/useAuthQueries';
import { updateAuthStoreFromFirebase } from '@/lib/updateAuthStore';
import { useAuthStore } from '@/stores/authStore';
import { markAsRecentlyRegistered } from '@/hooks/useSubscriptionStatus';

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

interface AddEmployeeInput {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AddEmployeeResponse {
  success: boolean;
  employeeId: string;
  inviteToken: string;
}

export const UnifiedRegisterForm: React.FC<UnifiedRegisterFormProps> = ({
  inviteData,
  onRegistrationComplete
}) => {
  const router = useRouter();
  const step2Ref = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false); // Prevent double-click race condition
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Employee invite state (max 5)
  const [pendingEmployees, setPendingEmployees] = useState<{
    email: string;
    firstName: string;
    lastName: string;
  }[]>([]);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('');
  const [newEmployeeLastName, setNewEmployeeLastName] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [checkingEmployeeEmail, setCheckingEmployeeEmail] = useState(false);
  const [employeeSuccess, setEmployeeSuccess] = useState(false);

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

  // Employee invite helpers
  const handleAddEmployee = async () => {
    setEmployeeError('');

    if (pendingEmployees.length >= 5) {
      setEmployeeError('Maximum 5 munkatársat adhatsz hozzá');
      return;
    }

    if (!newEmployeeEmail.trim() || !newEmployeeFirstName.trim() || !newEmployeeLastName.trim()) {
      setEmployeeError('Minden mező kitöltése kötelező');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployeeEmail)) {
      setEmployeeError('Érvénytelen email cím');
      return;
    }

    // Check for duplicate email in pending list
    if (pendingEmployees.some(emp => emp.email.toLowerCase() === newEmployeeEmail.toLowerCase())) {
      setEmployeeError('Ez az email cím már hozzá lett adva');
      return;
    }

    // Check if same as main registration email
    if (newEmployeeEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()) {
      setEmployeeError('Nem adhatod hozzá a saját email címedet');
      return;
    }

    // Check if email is already in use (like main email field)
    setCheckingEmployeeEmail(true);
    try {
      const checkEmail = httpsCallable<{ email: string }, { available: boolean; error?: string }>(
        functions,
        'checkEmailAvailability'
      );
      const result = await checkEmail({ email: newEmployeeEmail.trim().toLowerCase() });
      if (!result.data.available) {
        setEmployeeError('Ez az email cím már használatban van');
        setCheckingEmployeeEmail(false);
        return;
      }
    } catch (err) {
      console.error('Employee email check error:', err);
      setEmployeeError('Nem sikerült ellenőrizni az email címet. Kérlek próbáld újra.');
      setCheckingEmployeeEmail(false);
      return;
    }
    setCheckingEmployeeEmail(false);

    setPendingEmployees(prev => [...prev, {
      email: newEmployeeEmail.trim().toLowerCase(),
      firstName: newEmployeeFirstName.trim(),
      lastName: newEmployeeLastName.trim()
    }]);

    // Clear inputs
    setNewEmployeeEmail('');
    setNewEmployeeFirstName('');
    setNewEmployeeLastName('');

    // Show success message
    setEmployeeSuccess(true);
    setTimeout(() => setEmployeeSuccess(false), 3000); // Hide after 3 seconds
  };

  const handleRemoveEmployee = (email: string) => {
    setPendingEmployees(prev => prev.filter(emp => emp.email !== email));
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
    // GUARD: Prevent concurrent executions (for invited employee flow)
    if (isProcessingRef.current) {
      console.log('[Registration] Already processing, ignoring duplicate click');
      return;
    }

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
    // GUARD: Prevent concurrent executions (race condition fix)
    if (isProcessingRef.current) {
      console.log('[Registration] Already processing, ignoring duplicate click');
      return;
    }

    isProcessingRef.current = true; // Set immediately (synchronous)
    setError('');

    // Validate Step 2 (optional fields)
    if (!validateStep2()) {
      isProcessingRef.current = false; // Reset on validation failure
      return;
    }

    // Check if there are unsaved employee details in input fields
    // If user filled in employee data but didn't click "Munkatárs hozzáadása", auto-save it
    const hasUnsavedEmployeeData = newEmployeeEmail.trim() || newEmployeeFirstName.trim() || newEmployeeLastName.trim();

    if (hasUnsavedEmployeeData) {
      // Check if all required fields are filled
      const allFieldsFilled = newEmployeeEmail.trim() && newEmployeeFirstName.trim() && newEmployeeLastName.trim();

      if (!allFieldsFilled) {
        // Partial data - ask user to complete or clear
        setError('Töltsd ki az összes munkatárs mezőt, vagy töröld a részben kitöltött adatokat a folytatáshoz.');
        isProcessingRef.current = false;
        return;
      }

      // Validate employee email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmployeeEmail.trim())) {
        setEmployeeError('Érvénytelen munkatárs email cím');
        isProcessingRef.current = false;
        return;
      }

      // Check if max employees reached
      if (pendingEmployees.length >= 5) {
        setEmployeeError('Maximum 5 munkatársat adhatsz hozzá. Töröld az egyik meglévőt vagy hagyd üresen a mezőket.');
        isProcessingRef.current = false;
        return;
      }

      // Check for duplicate in pending list
      if (pendingEmployees.some(emp => emp.email.toLowerCase() === newEmployeeEmail.trim().toLowerCase())) {
        setEmployeeError('Ez az email cím már hozzá lett adva');
        isProcessingRef.current = false;
        return;
      }

      // Check if same as main registration email
      if (newEmployeeEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()) {
        setEmployeeError('Nem adhatod hozzá a saját email címedet');
        isProcessingRef.current = false;
        return;
      }

      // Check employee email availability
      setLoading(true);
      try {
        console.log('[Registration] Checking unsaved employee email availability...');
        const checkEmail = httpsCallable<{ email: string }, { available: boolean; error?: string }>(
          functions,
          'checkEmailAvailability'
        );
        const result = await checkEmail({ email: newEmployeeEmail.trim().toLowerCase() });

        if (!result.data.available) {
          setEmployeeError('Ez az email cím már használatban van');
          setLoading(false);
          isProcessingRef.current = false;
          return;
        }
      } catch (err) {
        console.error('[Registration] Employee email check error:', err);
        // Continue - backend will catch duplicates
      }

      // All validations passed - add to pending employees
      console.log('[Registration] Auto-saving unsaved employee data...');
      setPendingEmployees(prev => [...prev, {
        email: newEmployeeEmail.trim().toLowerCase(),
        firstName: newEmployeeFirstName.trim(),
        lastName: newEmployeeLastName.trim()
      }]);

      // Clear the input fields
      setNewEmployeeEmail('');
      setNewEmployeeFirstName('');
      setNewEmployeeLastName('');
      setEmployeeSuccess(true);
      setTimeout(() => setEmployeeSuccess(false), 3000);
    }

    setLoading(true);

    // Re-check email availability before registration (prevents race condition)
    // Email was checked in Step 1, but someone might have registered it since then
    if (!inviteData) {
      try {
        console.log('[Unified Registration] Re-checking email availability...');
        const checkEmail = httpsCallable<{ email: string }, { available: boolean; error?: string }>(
          functions,
          'checkEmailAvailability'
        );
        const emailCheckResult = await checkEmail({ email: formData.email.trim().toLowerCase() });

        if (!emailCheckResult.data.available) {
          console.log('[Unified Registration] Email is taken, blocking registration');
          setError('Ez az email cím már használatban van. Próbálj bejelentkezni vagy használj másik email címet.');
          setLoading(false);
          isProcessingRef.current = false;
          return;
        }
        console.log('[Unified Registration] Email is available, proceeding...');
      } catch (emailErr) {
        console.error('[Unified Registration] Email check error:', emailErr);
        // Continue anyway - Firebase Auth will catch duplicates as fallback
      }
    }

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

      // CRITICAL: Set pending verification in sessionStorage IMMEDIATELY
      // This prevents the register page from redirecting before registration completes
      sessionStorage.setItem('pendingEmailVerification', JSON.stringify({
        userId: userCredential.user.uid,
        email: formData.email.trim().toLowerCase()
      }));
      console.log('[Unified Registration] ✅ Set pending verification flag in sessionStorage');

      // Update display name (Hungarian convention: family name first)
      console.log('[Unified Registration] Step 2: Updating display name...');
      await updateProfile(userCredential.user, {
        displayName: `${formData.lastName.trim()} ${formData.firstName.trim()}`
      });

      console.log('[Unified Registration] ✅ Display name updated');

      // Step 3: Store registration data for AFTER email verification
      // We DON'T create Firestore documents yet - only after email is verified
      console.log('[Unified Registration] Step 3: Storing registration data for after verification...');

      const pendingRegistrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        billingEmail: formData.billingEmail.trim(),
        industry: formData.industry,
        companySize: formData.companySize,
        pendingEmployees: pendingEmployees.map(emp => ({
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email
        }))
      };

      // Store in sessionStorage - will be used after email verification
      sessionStorage.setItem('pendingRegistrationData', JSON.stringify(pendingRegistrationData));
      console.log('[Unified Registration] ✅ Registration data stored in sessionStorage');

      // Mark as recently registered to skip expensive subscription status check
      markAsRecentlyRegistered();

      // Show verification modal IMMEDIATELY
      if (onRegistrationComplete) {
        console.log('[Unified Registration] Showing verification modal immediately...');
        onRegistrationComplete(userCredential.user.uid, formData.email.trim());
      }

      // Send verification email in background (fire-and-forget)
      const sendEmailVerificationCode = httpsCallable(functions, 'sendEmailVerificationCode');
      sendEmailVerificationCode({})
        .then((result: any) => {
          console.log('[Unified Registration] ✅ Verification email sent:', result.data);
          if (result.data.code) {
            console.log('🔐 VERIFICATION CODE (emulator):', result.data.code);
          }
        })
        .catch((emailError: any) => {
          console.error('[Unified Registration] ⚠️ Email send failed:', emailError);
          // User can use Resend button in modal
        });

    } catch (err: any) {
      console.error('[Unified Registration] Error:', err);
      setError(getAuthErrorMessage(err));
      setLoading(false);
      isProcessingRef.current = false; // Reset on error to allow retry
    }
    // Note: Don't set loading to false if successful - parent will handle the flow
    // Note: Don't reset isProcessingRef on success - user will be redirected
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
            {inviteData ? 'Regisztráció és csatlakozás' : 'Kezdjünk bele a kalandba'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {inviteData ? 'Töltsd ki az adataidat' : '5 munkatársad is hozzáférhet a tartalmakhoz'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Last Name - Hungarian convention: family name first */}
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

          {/* Company Name (Optional) - Hidden for invited employees */}
          {!inviteData && (
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
          )}

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
              Email cím {inviteData && <span className="text-gray-500 text-xs font-normal">(meghívóból)</span>}
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
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
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
              onClick={() => {
                if (inviteData) {
                  // For invited employees, skip Step 2 and complete registration
                  handleComplete();
                } else {
                  // For regular users, go to Step 2
                  handleNext();
                }
              }}
              disabled={loading || checkingEmail}
              className="w-full py-3 px-6 bg-gradient-to-t from-brand-secondary to-brand-secondary/50 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ellenőrzés...
                </>
              ) : inviteData ? (
                'Regisztráció befejezése'
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

      {/* Step 2: Employee Invites - Hidden for invited employees */}
      {!inviteData && currentStep === 2 && (
        <motion.div
          ref={step2Ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pt-8 border-t border-gray-200"
        >
          {/* Employee Invites Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Munkatársak meghívása
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              opcionális, max. 5 fő
            </p>

            {/* Add Employee Form - Vertical layout like Step 1 */}
            <div className="space-y-5">
              {/* Last Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vezetéknév
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="form-input w-full py-2.5 pl-10"
                    placeholder="Kovács"
                    value={newEmployeeLastName}
                    onChange={(e) => {
                      setNewEmployeeLastName(e.target.value);
                      setEmployeeError('');
                      setEmployeeSuccess(false);
                    }}
                    disabled={loading || checkingEmployeeEmail || pendingEmployees.length >= 5}
                  />
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Keresztnév
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="form-input w-full py-2.5 pl-10"
                    placeholder="János"
                    value={newEmployeeFirstName}
                    onChange={(e) => {
                      setNewEmployeeFirstName(e.target.value);
                      setEmployeeError('');
                      setEmployeeSuccess(false);
                    }}
                    disabled={loading || checkingEmployeeEmail || pendingEmployees.length >= 5}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email cím
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="form-input w-full py-2.5 pl-10"
                    placeholder="pelda@email.com"
                    value={newEmployeeEmail}
                    onChange={(e) => {
                      setNewEmployeeEmail(e.target.value);
                      setEmployeeError('');
                      setEmployeeSuccess(false);
                    }}
                    disabled={loading || checkingEmployeeEmail || pendingEmployees.length >= 5}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmployee();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Error message */}
              {employeeError && (
                <p className="text-sm text-red-600">{employeeError}</p>
              )}

              {/* Success message */}
              {employeeSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Hozzáadva!
                </p>
              )}

              {/* Add Employee Button */}
              <button
                type="button"
                onClick={handleAddEmployee}
                disabled={loading || checkingEmployeeEmail || pendingEmployees.length >= 5}
                className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingEmployeeEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ellenőrzés...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Új munkatárs hozzáadása
                  </>
                )}
              </button>
            </div>

            {/* Pending Employees List */}
            {pendingEmployees.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Hozzáadott munkatársak ({pendingEmployees.length}/5):
                </p>
                {pendingEmployees.map((employee) => (
                  <div
                    key={employee.email}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-brand-secondary">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {employee.lastName} {employee.firstName}
                        </p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(employee.email)}
                      disabled={loading}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
        </motion.div>
      )}
    </div>
  );
};
