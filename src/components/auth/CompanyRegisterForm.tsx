'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Mail,
  Lock,
  User,
  Users,
  Briefcase,
  CheckCircle2,
  Loader2,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';

interface CompanyOnboardingData {
  // Step 1: Account owner
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  password: string;
  confirmPassword: string;

  // Step 2: Company details
  companyName: string;
  billingEmail: string;
  industry: string;
  companySize: string;

  // Step 3: Employees (optional)
  employees: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
  }[];
}

interface CompanyRegisterFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  onVerificationStart?: () => void;
  onRegistrationComplete?: (userId: string, email: string) => void;
}

interface CompleteOnboardingInput {
  companyName: string;
  billingEmail: string;
  industry: string;
  companySize: string;
  employees: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
  }[];
}

interface CompleteOnboardingResponse {
  success: boolean;
  companyId: string;
  employeesInvited: number;
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

export const CompanyRegisterForm: React.FC<CompanyRegisterFormProps> = ({ onSuccess, onBack, onVerificationStart, onRegistrationComplete }) => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CompanyOnboardingData>({
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    billingEmail: '',
    industry: '',
    companySize: '',
    employees: []
  });


  const updateField = (field: keyof CompanyOnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const addEmployee = () => {
    setFormData(prev => ({
      ...prev,
      employees: [...prev.employees, { firstName: '', lastName: '', email: '', jobTitle: '' }]
    }));
  };

  const removeEmployee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.filter((_, i) => i !== index)
    }));
  };

  const updateEmployee = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      )
    }));
  };

  const validateStep1 = () => {
    if (!formData.ownerFirstName.trim()) {
      setError('Kérlek add meg a keresztneved');
      return false;
    }
    if (!formData.ownerLastName.trim()) {
      setError('Kérlek add meg a vezetékneved');
      return false;
    }
    if (!formData.ownerEmail.trim()) {
      setError('Kérlek add meg az email címed');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      setError('Érvénytelen email cím');
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

  const validateStep2 = () => {
    if (!formData.companyName.trim()) {
      setError('Kérlek add meg a cégnevet');
      return false;
    }
    if (!formData.billingEmail.trim()) {
      setError('Kérlek add meg a számlázási email címet');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      setError('Érvénytelen számlázási email cím');
      return false;
    }
    if (!formData.industry) {
      setError('Kérlek válaszd ki az iparágat');
      return false;
    }
    if (!formData.companySize) {
      setError('Kérlek válaszd ki a cég méretét');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    for (let i = 0; i < formData.employees.length; i++) {
      const emp = formData.employees[i];
      if (!emp.firstName.trim() || !emp.lastName.trim() || !emp.email.trim()) {
        setError(`Kérlek töltsd ki az összes kötelező mezőt a(z) ${i + 1}. alkalmazottnál`);
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
        setError(`Érvénytelen email cím a(z) ${i + 1}. alkalmazottnál`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError('');

    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setError('');
    setLoading(true);

    console.log('[Company Registration] Starting registration process...');
    console.log('[Company Registration] Form data:', {
      ownerName: `${formData.ownerFirstName} ${formData.ownerLastName}`,
      ownerEmail: formData.ownerEmail,
      companyName: formData.companyName,
      billingEmail: formData.billingEmail,
      industry: formData.industry,
      companySize: formData.companySize,
      employeeCount: formData.employees.length
    });

    try {
      // Step 1: Create Firebase Auth user
      console.log('[Company Registration] Step 1: Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.ownerEmail.trim().toLowerCase(),
        formData.password
      );

      console.log('[Company Registration] ✅ User created successfully:', userCredential.user.uid);

      // Update display name
      console.log('[Company Registration] Step 2: Updating display name...');
      await updateProfile(userCredential.user, {
        displayName: `${formData.ownerFirstName} ${formData.ownerLastName}`
      });

      console.log('[Company Registration] ✅ Display name updated');

      // Step 2: Call Cloud Function to create company and setup everything
      console.log('[Company Registration] Step 3: Preparing to call completeCompanyOnboarding Cloud Function...');

      const completeOnboarding = httpsCallable<CompleteOnboardingInput, CompleteOnboardingResponse>(
        functions,
        'completeCompanyOnboarding'
      );

      const functionInput = {
        companyName: formData.companyName.trim(),
        billingEmail: formData.billingEmail.trim().toLowerCase(),
        industry: formData.industry,
        companySize: formData.companySize,
        employees: formData.employees.map(emp => ({
          firstName: emp.firstName.trim(),
          lastName: emp.lastName.trim(),
          email: emp.email.trim().toLowerCase(),
          jobTitle: emp.jobTitle.trim()
        }))
      };

      console.log('[Company Registration] Calling Cloud Function with input:', functionInput);

      const result = await completeOnboarding(functionInput);

      console.log('[Company Registration] ✅ Cloud Function returned:', result);

      if (result.data.success) {
        console.log('[Company Registration] ✅ Cloud Function succeeded, companyId:', result.data.companyId);

        // CRITICAL: Force token refresh to pick up new custom claims
        console.log('[Company Registration] Forcing token refresh to get custom claims...');
        await userCredential.user.getIdToken(true);
        await userCredential.user.reload();
        console.log('[Company Registration] ✅ Token refreshed');

        // Store user ID for verification modal FIRST (before any async operations)
        const userId = userCredential.user.uid;
        console.log('[Company Registration] Stored userId for modal:', userId);

        // Notify parent that verification is starting (BEFORE refreshUser to prevent redirect)
        if (onVerificationStart) {
          onVerificationStart();
        }

        // Send verification code immediately
        try {
          console.log('[Company Registration] Sending email verification code...');
          const sendEmailVerificationCode = httpsCallable(functions, 'sendEmailVerificationCode');
          const verificationResult = await sendEmailVerificationCode({}) as any;

          if (verificationResult.data.success) {
            console.log('[Company Registration] ✅ Verification code sent successfully');

            // In emulator mode, log the code for testing
            if (verificationResult.data.code) {
              console.log('🔐 VERIFICATION CODE (emulator):', verificationResult.data.code);
            }
          } else {
            console.error('[Company Registration] Failed to send verification code:', verificationResult.data.error);
          }
        } catch (emailError) {
          console.error('[Company Registration] Error sending verification code:', emailError);
        }

        // Notify parent to show the verification modal
        console.log('[Company Registration] Notifying parent to show verification modal...');
        setLoading(false);

        if (onRegistrationComplete) {
          console.log('[Company Registration] Calling onRegistrationComplete callback');
          onRegistrationComplete(userId, formData.ownerEmail);
        }
        console.log('[Company Registration] 📧 Parent should now render EmailVerificationModal');

        // NOTE: refreshUser() is intentionally NOT called here to prevent redirect race condition
        // It will be called in the onVerified callback AFTER email verification completes
      } else {
        setError('Hiba történt a regisztráció során');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('❌ [Company Registration] ERROR occurred:', err);
      console.error('❌ [Company Registration] Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        fullError: JSON.stringify(err, null, 2)
      });

      if (err.code === 'auth/email-already-in-use') {
        setError('Ez az email cím már használatban van');
        setCurrentStep(1);
      } else if (err.code === 'auth/weak-password') {
        setError('A jelszó túl gyenge');
        setCurrentStep(1);
      } else if (err.code === 'functions/not-found') {
        console.error('❌ [Company Registration] Cloud Function not found! Is the emulator running?');
        setError('A rendszer nem elérhető. Kérjük, próbálja újra később. (Cloud Function not found)');
      } else if (err.code === 'functions/internal') {
        console.error('❌ [Company Registration] Cloud Function internal error:', err.details);
        setError(`Belső hiba történt: ${err.message}`);
      } else {
        setError(err.message || 'Hiba történt a regisztráció során');
      }
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all";

  // Parent will render the EmailVerificationModal when onRegistrationComplete is called

  return (
    <div className="space-y-6">
      {/* Back button */}
      {onBack && currentStep === 1 && (
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Vissza</span>
        </button>
      )}

      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step === currentStep
                  ? 'bg-gray-900 text-white'
                  : step < currentStep
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                step
              )}
            </div>
            {step < 4 && (
              <div className={`w-8 h-0.5 mx-1 ${step < currentStep ? 'bg-gray-300' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-green-50 border border-green-200 rounded-lg text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-900 mb-1">Sikeres regisztráció!</h3>
          <p className="text-sm text-green-700">Átirányítás a céges irányítópultra...</p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Account owner */}
        {currentStep === 1 && !success && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fiók tulajdonos</h3>
              <p className="text-sm text-gray-600">Add meg a vállalati fiók tulajdonosának adatait</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keresztnév *
                </label>
                <input
                  type="text"
                  value={formData.ownerFirstName}
                  onChange={(e) => updateField('ownerFirstName', e.target.value)}
                  className={inputClass}
                  placeholder="János"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vezetéknév *
                </label>
                <input
                  type="text"
                  value={formData.ownerLastName}
                  onChange={(e) => updateField('ownerLastName', e.target.value)}
                  className={inputClass}
                  placeholder="Kovács"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email cím *
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => updateField('ownerEmail', e.target.value)}
                className={inputClass}
                placeholder="janos.kovacs@cegem.hu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jelszó *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={inputClass}
                placeholder="Minimum 6 karakter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jelszó megerősítése *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className={inputClass}
                placeholder="Írd be újra a jelszót"
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Company details */}
        {currentStep === 2 && !success && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vállalati adatok</h3>
              <p className="text-sm text-gray-600">Add meg a vállalat részleteit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cégnév *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className={inputClass}
                placeholder="Cégem Kft."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Számlázási email cím *
              </label>
              <input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => updateField('billingEmail', e.target.value)}
                className={inputClass}
                placeholder="szamlazas@cegem.hu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iparág *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className={inputClass}
              >
                <option value="">Válassz iparágat</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cég mérete *
              </label>
              <select
                value={formData.companySize}
                onChange={(e) => updateField('companySize', e.target.value)}
                className={inputClass}
              >
                <option value="">Válaszd ki a cég méretét</option>
                {companySizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Step 3: Add employees */}
        {currentStep === 3 && !success && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Alkalmazottak hozzáadása</h3>
              <p className="text-sm text-gray-600">Meghívhatod a csapattagjaidat (opcionális)</p>
            </div>

            {formData.employees.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">Még nem adtál hozzá alkalmazottakat</p>
                <button
                  onClick={addEmployee}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Első alkalmazott hozzáadása
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.employees.map((employee, index) => (
                  <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative">
                    <button
                      onClick={() => removeEmployee(index)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Keresztnév *
                        </label>
                        <input
                          type="text"
                          value={employee.firstName}
                          onChange={(e) => updateEmployee(index, 'firstName', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                          placeholder="Péter"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Vezetéknév *
                        </label>
                        <input
                          type="text"
                          value={employee.lastName}
                          onChange={(e) => updateEmployee(index, 'lastName', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                          placeholder="Nagy"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Email cím *
                        </label>
                        <input
                          type="email"
                          value={employee.email}
                          onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                          placeholder="peter.nagy@cegem.hu"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Munkakör
                        </label>
                        <input
                          type="text"
                          value={employee.jobTitle}
                          onChange={(e) => updateEmployee(index, 'jobTitle', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                          placeholder="Marketing Manager"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addEmployee}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  <span className="font-medium">Újabb alkalmazott hozzáadása</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && !success && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Összefoglaló</h3>
              <p className="text-sm text-gray-600">Ellenőrizd az adatokat mielőtt véglegesíted</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Fiók tulajdonos
                </h4>
                <div className="text-sm space-y-1 text-gray-700">
                  <p><strong>Név:</strong> {formData.ownerFirstName} {formData.ownerLastName}</p>
                  <p><strong>Email:</strong> {formData.ownerEmail}</p>
                </div>
              </div>

              <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Vállalat
                </h4>
                <div className="text-sm space-y-1 text-gray-700">
                  <p><strong>Név:</strong> {formData.companyName}</p>
                  <p><strong>Számlázási email:</strong> {formData.billingEmail}</p>
                  <p><strong>Iparág:</strong> {formData.industry}</p>
                  <p><strong>Méret:</strong> {formData.companySize}</p>
                </div>
              </div>

              <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Alkalmazottak
                </h4>
                {formData.employees.length === 0 ? (
                  <p className="text-sm text-gray-500">Később adhatsz hozzá alkalmazottakat</p>
                ) : (
                  <div className="space-y-2">
                    {formData.employees.map((emp, index) => (
                      <div key={index} className="text-sm text-gray-700 flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <span>{emp.firstName} {emp.lastName}</span>
                        <span className="text-xs text-gray-500">{emp.jobTitle || 'Nincs munkakör'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {!success && (
        <div className="flex items-center justify-between pt-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Tovább
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regisztráció...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Regisztráció befejezése
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
