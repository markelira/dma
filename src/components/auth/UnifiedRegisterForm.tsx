'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  CreditCard,
  CheckCircle,
  Star,
  ChevronDown
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { getAuthErrorMessage } from '@/hooks/useAuthQueries';
import { markAsRecentlyRegistered } from '@/hooks/useSubscriptionStatus';
import { useAuth } from '@/contexts/AuthContext';

// Cloud Function interfaces for pending registration
interface SavePendingRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  currentStep: 1 | 2 | 3;
  pendingEmployees: Array<{ email: string; firstName: string; lastName: string }>;
  stripeSessionId?: string;
  stripeCustomerId?: string;
}

interface GetPendingRegistrationResponse {
  found: boolean;
  alreadyCompleted?: boolean;
  data?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
    currentStep: 1 | 2 | 3;
    pendingEmployees: Array<{ email: string; firstName: string; lastName: string }>;
    stripeSessionId?: string;
  };
}
import { RegistrationProgressBar } from './RegistrationProgressBar';
import { StripeEmbeddedCheckout } from './StripeEmbeddedCheckout';
import { RiddleDiscountCard } from './RiddleDiscountCard';
import Image from 'next/image';
import Link from 'next/link';

interface UnifiedRegistrationData {
  // Step 1: Personal info (all required)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Optional company details
  companyName: string;
}

interface PreRegistrationData {
  valid: boolean;
  preRegistrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

interface UnifiedRegisterFormProps {
  inviteData?: {
    valid: boolean;
    companyName: string;
    employeeEmail: string;
    employeeName: string;
  } | null;
  preRegistrationData?: PreRegistrationData | null;
  onRegistrationComplete?: (userId: string, email: string) => void;
}

interface UnifiedRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  billingEmail?: string;
  preRegistrationId?: string;
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

/**
 * Retry a function with exponential backoff
 * Critical for Cloud Function calls that may fail due to cold starts or network issues
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      // Don't retry on auth errors - these won't resolve with retries
      if (error.code === 'unauthenticated' || error.code === 'permission-denied') {
        throw error;
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Check if browser is Internet Explorer or legacy Edge
 */
function isLegacyBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1 || ua.indexOf('Edge/') > -1;
}

interface AddEmployeeResponse {
  success: boolean;
  employeeId: string;
  inviteToken: string;
}

// Testimonials data from homepage
const testimonials = [
  { name: 'Göndör János', review: 'Együttműködésünk során új szintre emeltük cégünk működését. Olyan vállalati struktúrát sikerült kialakítani amivel alapot képeztünk a további fejlődésnek. Köszönet mindenért!' },
  { name: 'Joe Buránszki', review: 'A legjobban azt szeretem, hogy könnyen használható életszerű információt kaptam a cég működésében. És ehhez kaptam egy jó alap rendszert, amiben tudok nap mint nap gondolkodni és jobban tudok tervezni.' },
  { name: 'Máté Kiss', review: 'Kiváló, felkészült csapat. Arra törekszenek, hogy gyakorlatban is hasznosítható tudást adjanak át, segítve a vállalkozásokat belső folyamataik, rendszereik kiépítésében, fejlesztésében.' },
  { name: 'Dóra Hodosi-Bodnár', review: 'A DMA-s képzések miatt határozottan fejlődnek a személyes képességeim. Könnyebben tudom kezelni a konfliktusokat, és az esetlegesen felmerülő problémákat.' },
  { name: 'Balázs Végső', review: 'Amióta a DMA-nál tanulok, konzultálok, jobban tudom kezelni az embereket, helyreállt a kommunikáció a cégben az alvállalkozóimmal és az alkalmazottakkal.' },
  { name: 'Viktória Vass', review: 'A DMA olyan tudást adott át nekem amivel a lehető legegyszerűbben stressz mentesen oldom meg a problémákat, konfliktus helyzeteket. Megmutatta a dolgok pozitív oldalát.' },
  { name: 'Imre Ling', review: 'A képzésen elhangzott ismereteket hasznosan lehet azonnal alkalmazni a gyakorlatban. Ezáltal hatékonyabban működik a cég, stressz mentessé válik.' },
  { name: 'Miklos Molnar', review: 'Hatékony képzések ami nem csak a vállalkozásomat segíti elő, hanem a személyiség fejlődésben is sokat segít. Igazi vezetőkkel tanulhatok.' },
  { name: 'István Oláh', review: 'DMA segíti a vállalkozásokat a céljaik elérésében. Segít a munkatársaknak és tulajdonosoknak a hatékonyabb munkavégzésben. A személyes fejlődés és jó hangulat garantált!' },
  { name: 'Attila Bíró', review: 'Már egy éve dolgozunk együtt. Csak jó tapasztalataim vannak. Nagyon profi csapat, mindenkinek csak ajánlani tudom.' },
  { name: 'Ottó Kerekes', review: 'A DMA nagyon sokat segített a vállalkozásunkba, hogy az precizen és biztonságosan működhessen. Ezen kívül a kommunikációdat is fejlesztheted.' },
  { name: 'Benjamin Szabó', review: 'Hatalmas segítséget nyújtanak a munkám elvégzéséhez. Nem csak elméleti hanem gyakorlati tanácsokkal és útmutatásokkal segítenek.' },
];

// Value Proposition Section - exported for use in page layout
// Subtle styling to blend with page background
interface ValuePropositionSectionProps {
  collapsible?: boolean;
}

export function ValuePropositionSection({ collapsible = false }: ValuePropositionSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Auto-advance carousel every 5 seconds (pause when expanded)
  useEffect(() => {
    if (isExpanded) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isExpanded]);

  // Reset expanded state when testimonial changes
  useEffect(() => {
    setIsExpanded(false);
  }, [currentIndex]);

  const currentTestimonial = testimonials[currentIndex];
  const initials = currentTestimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const isLongReview = currentTestimonial.review.length > 120;

  return (
    <div className="text-gray-600 p-6 lg:p-8">
      {/* DMA Logo - sticky at top */}
      <div className="mb-8">
        <Link href="/" className="inline-flex" aria-label="DMA">
          <Image
            src="/images/dma-logo.png"
            alt="DMA Logo"
            width={100}
            height={36}
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Headline */}
      <h2 className="text-xl lg:text-2xl font-bold mb-2 text-gray-800">
        Vágj bele a kalandba
      </h2>

      {/* Collapsible toggle button (mobile only) */}
      {collapsible && (
        <button
          onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          className="flex items-center gap-2 text-sm text-brand-secondary font-medium mt-3 mb-2 py-1"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDetailsExpanded ? 'rotate-180' : ''}`} />
          {isDetailsExpanded ? 'Csomag részletei bezárása' : 'Masterclass csomag részletei'}
        </button>
      )}

      {/* Collapsible content - shown always on desktop, toggle on mobile */}
      {(!collapsible || isDetailsExpanded) && (
        <>
      <p className="text-gray-500 text-sm lg:text-base mb-6">

      </p>

      {/* Benefits - subtle brand color checkmarks */}
      <ul className="space-y-2.5 sm:space-y-3 mb-6">
        <li className="flex items-start gap-2.5 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm lg:text-base text-gray-600">14.990 Ft/hó</span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm lg:text-base text-gray-600">Teljes hozzáférés 150+ struktúraépítő tartalomhoz</span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm lg:text-base text-gray-600">Több mint 200 órányi azonnal alkalmazható, működő rendszer</span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm lg:text-base text-gray-600">5 munkatárs díjmentes hozzáadása</span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm lg:text-base text-gray-600">Hetente frissülő tartalmak</span>
        </li>
        <li className="flex items-start gap-2.5 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <span className="text-xs sm:text-sm lg:text-base text-gray-600">Bármikor lemondható</span>
        </li>
      </ul>

      {/* Testimonial Carousel */}
      <div>
        {/* Stars and Google Review badge */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
          ))}
          <span className="text-[10px] sm:text-xs text-gray-400 ml-1.5 sm:ml-2">Google Review</span>
        </div>

        {/* Animated testimonial */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className={`text-gray-500 text-xs sm:text-sm italic mb-2 leading-relaxed ${!isExpanded && isLongReview ? 'line-clamp-3' : ''}`}>
                "{currentTestimonial.review}"
              </p>
              {isLongReview && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-brand-secondary text-[10px] sm:text-xs font-medium hover:underline mb-3 py-1"
                >
                  {isExpanded ? 'Kevesebb' : 'Tovább olvasom...'}
                </button>
              )}
              <div className="flex items-center gap-2.5 sm:gap-3 mt-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center text-xs sm:text-sm font-bold text-brand-secondary">
                  {initials}
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm text-gray-700">{currentTestimonial.name}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators - larger tap targets for mobile */}
        <div className="flex gap-0.5 mt-4 justify-center">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="p-2 touch-manipulation"
              aria-label={`Go to testimonial ${i + 1}`}
            >
              <span
                className={`block w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-brand-secondary' : 'bg-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

export const UnifiedRegisterForm: React.FC<UnifiedRegisterFormProps> = ({
  inviteData,
  preRegistrationData,
  // onRegistrationComplete is reserved for future use (e.g., analytics callbacks)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRegistrationComplete: _onRegistrationComplete
}) => {
  const router = useRouter();
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const recoveryCheckInitiatedRef = useRef(false); // Prevents multiple recovery checks

  // Step state: 1 = Personal Info, 2 = Colleagues, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Firebase user state (created after Step 1)
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);

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

  // Recovery state
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);

  // Skip payment state
  const [isSkippingPayment, setIsSkippingPayment] = useState(false);

  // Riddle discount state (not persisted — always show on fresh Step 3)
  const [riddleDismissed, setRiddleDismissed] = useState(false);

  const [formData, setFormData] = useState<UnifiedRegistrationData>({
    firstName: preRegistrationData?.firstName || inviteData?.employeeName.split(' ')[0] || '',
    lastName: preRegistrationData?.lastName || inviteData?.employeeName.split(' ').slice(1).join(' ') || '',
    email: preRegistrationData?.email || inviteData?.employeeEmail || '',
    phone: preRegistrationData?.phone || '',
    password: '',
    confirmPassword: '',
    companyName: preRegistrationData?.companyName || ''
  });

  // Get auth context for checking logged-in user
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Track if we're currently checking to prevent duplicate calls
  const [isCheckingPending, setIsCheckingPending] = useState(false);

  // Check for pending registration on mount (recovery flow)
  useEffect(() => {
    const checkPendingRegistration = async () => {
      // DIAGNOSTIC LOG 1: Entry point
      console.log('🔍 [UnifiedRegisterForm] Recovery useEffect triggered', {
        recoveryChecked,
        authLoading,
        isCheckingPending,
        hasInviteData: !!inviteData,
        hasUser: !!user,
        userId: user?.uid,
        userEmail: user?.email,
        recoveryCheckInitiatedRef: recoveryCheckInitiatedRef.current,
        timestamp: Date.now()
      });

      // Skip if already checked, still loading auth, currently checking, or it's an invite flow
      if (recoveryChecked || authLoading || isCheckingPending || inviteData) {
        // DIAGNOSTIC LOG 2: Guard triggered
        console.log('🔍 [UnifiedRegisterForm] Recovery check SKIPPED - guard triggered', {
          reason: recoveryChecked ? 'recoveryChecked' :
                  authLoading ? 'authLoading' :
                  isCheckingPending ? 'isCheckingPending' : 'inviteData',
          timestamp: Date.now()
        });
        return;
      }

      // Additional safeguard using ref - survives re-renders and state issues
      if (recoveryCheckInitiatedRef.current) {
        console.log('[Registration] Recovery check already initiated (ref), skipping');
        setRecoveryChecked(true);
        return;
      }

      // Only check if user is logged in
      if (!user) {
        // DIAGNOSTIC LOG 3: No user - THIS MAY BE THE BUG
        console.log('🔍 [UnifiedRegisterForm] No user - marking recoveryChecked=true (THIS MAY BE THE BUG)', {
          timestamp: Date.now()
        });
        // Not logged in yet - mark as checked (new users don't need recovery)
        setRecoveryChecked(true);
        recoveryCheckInitiatedRef.current = true;
        return;
      }

      // CRITICAL: Set ref FIRST to prevent any race conditions, then set state
      recoveryCheckInitiatedRef.current = true;
      setIsCheckingPending(true);

      try {
        // DIAGNOSTIC LOG 4: Calling getPendingRegistration
        console.log('🔍 [UnifiedRegisterForm] Calling getPendingRegistration for user', {
          userId: user.uid,
          userEmail: user.email,
          timestamp: Date.now()
        });
        const getPendingFn = httpsCallable<void, GetPendingRegistrationResponse>(
          functions,
          'getPendingRegistration'
        );
        const result = await getPendingFn();

        // DIAGNOSTIC LOG 5: Response received
        console.log('🔍 [UnifiedRegisterForm] getPendingRegistration response', {
          found: result.data.found,
          alreadyCompleted: result.data.alreadyCompleted,
          currentStep: result.data.data?.currentStep,
          hasData: !!result.data.data,
          timestamp: Date.now()
        });

        if (result.data.alreadyCompleted) {
          // User already completed registration - redirect
          console.log('[Registration] User already completed registration, redirecting...');
          router.push('/vallalkozas/kezdolap');
          return;
        }

        if (result.data.found && result.data.data) {
          const pendingData = result.data.data;
          console.log('[Registration] Found pending registration at step:', pendingData.currentStep);

          // Restore form data
          setFormData(prev => ({
            ...prev,
            firstName: pendingData.firstName || prev.firstName,
            lastName: pendingData.lastName || prev.lastName,
            email: pendingData.email || prev.email,
            phone: pendingData.phone || prev.phone,
            companyName: pendingData.companyName || prev.companyName
          }));

          // Restore employees
          if (pendingData.pendingEmployees && pendingData.pendingEmployees.length > 0) {
            setPendingEmployees(pendingData.pendingEmployees);
          }

          // Set Firebase user ID
          setFirebaseUserId(user.uid);

          // Resume at correct step
          setCurrentStep(pendingData.currentStep);
          setIsRecovering(true);
        }
      } catch (err) {
        console.error('[Registration] Error checking pending registration:', err);
      } finally {
        // Always mark as checked after completion (success or error)
        setRecoveryChecked(true);
        setIsCheckingPending(false);
      }
    };

    checkPendingRegistration();
  }, [user, authLoading, recoveryChecked, isCheckingPending, inviteData, router]);

  const updateField = (field: keyof UnifiedRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // ============ EMPLOYEE HELPERS ============

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

    if (pendingEmployees.some(emp => emp.email.toLowerCase() === newEmployeeEmail.toLowerCase())) {
      setEmployeeError('Ez az email cím már hozzá lett adva');
      return;
    }

    if (newEmployeeEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()) {
      setEmployeeError('Nem adhatod hozzá a saját email címedet');
      return;
    }

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

    setNewEmployeeEmail('');
    setNewEmployeeFirstName('');
    setNewEmployeeLastName('');
    setEmployeeSuccess(true);
    setTimeout(() => setEmployeeSuccess(false), 3000);
  };

  const handleRemoveEmployee = (email: string) => {
    setPendingEmployees(prev => prev.filter(emp => emp.email !== email));
  };

  // ============ VALIDATION ============

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

    // Check if email is already in use (unless coming from invite or pre-registration)
    if (!inviteData && !preRegistrationData) {
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

  // ============ STEP HANDLERS ============

  // Step 1 → Step 2: Create Firebase Auth user, then move to colleagues
  const handleStep1Next = async () => {
    if (isProcessingRef.current) return;
    setError('');

    const isValid = await validateStep1();
    if (!isValid) return;

    isProcessingRef.current = true;
    setLoading(true);

    try {
      // Create Firebase Auth user
      console.log('[Registration] Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password
      );

      console.log('[Registration] User created:', userCredential.user.uid);
      setFirebaseUserId(userCredential.user.uid);

      // Update display name (Hungarian convention: family name first)
      await updateProfile(userCredential.user, {
        displayName: `${formData.lastName.trim()} ${formData.firstName.trim()}`
      });

      // Save pending registration to Firestore (replaces sessionStorage)
      // CRITICAL: Use retry logic to handle cold starts and network issues
      const savePendingFn = httpsCallable<SavePendingRegistrationInput, { success: boolean }>(
        functions,
        'savePendingRegistration'
      );

      try {
        await retryWithBackoff(async () => {
          const result = await savePendingFn({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            companyName: formData.companyName.trim(),
            currentStep: 2,
            pendingEmployees: []
          });
          if (!result.data.success) {
            throw new Error('Pending registration save returned unsuccessful');
          }
          return result;
        }, 3, 1000);
        console.log('[Registration] Saved pending registration to Firestore');
      } catch (saveError: any) {
        console.error('[Registration] Failed to save pending registration after retries:', saveError);
        // Delete the Firebase Auth user since we can't continue without pending registration
        try {
          await userCredential.user.delete();
          console.log('[Registration] Rolled back Firebase Auth user due to save failure');
        } catch (deleteError) {
          console.error('[Registration] Failed to rollback auth user:', deleteError);
        }
        throw new Error('Nem sikerült menteni a regisztrációs adatokat. Kérjük, próbáld újra később.');
      }

      // Mark as recently registered to skip expensive subscription check
      markAsRecentlyRegistered();

      // For invited employees, complete immediately (no payment needed)
      if (inviteData) {
        console.log('[Registration] Invited employee - completing registration immediately');
        await completeRegistration(userCredential.user.uid);
        return;
      }

      // Move to Step 2 (Colleagues)
      setCurrentStep(2);
      setLoading(false);
      isProcessingRef.current = false;

      setTimeout(() => {
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error('[Registration] Error:', err);
      setError(getAuthErrorMessage(err));
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  // Step 2 → Step 3: Move to payment
  const handleStep2Next = async () => {
    // Check if there are unsaved employee details
    const hasUnsavedData = newEmployeeEmail.trim() || newEmployeeFirstName.trim() || newEmployeeLastName.trim();
    if (hasUnsavedData) {
      const allFieldsFilled = newEmployeeEmail.trim() && newEmployeeFirstName.trim() && newEmployeeLastName.trim();
      if (!allFieldsFilled) {
        setEmployeeError('Töltsd ki az összes munkatárs mezőt, vagy töröld a részben kitöltött adatokat.');
        return;
      }
      // Auto-save the unsaved employee
      await handleAddEmployee();
    }

    // Save pending registration to Firestore with employees
    try {
      const savePendingFn = httpsCallable<SavePendingRegistrationInput, { success: boolean }>(
        functions,
        'savePendingRegistration'
      );
      await savePendingFn({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        currentStep: 3,
        pendingEmployees: pendingEmployees
      });
      console.log('[Registration] Updated pending registration with employees');
    } catch (err) {
      console.error('[Registration] Error saving pending registration:', err);
      // Continue anyway - webhook can still complete registration
    }

    // Move to Step 3 (Payment) — reset riddle so it always shows
    setRiddleDismissed(false);
    sessionStorage.removeItem('riddle_dismissed');
    sessionStorage.removeItem('riddle_coupon_code');
    setCurrentStep(3);
    setTimeout(() => {
      step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };


  // Step 3 Complete: Payment done, finalize registration
  const handlePaymentComplete = async () => {
    console.log('[Registration] Payment completed, finalizing registration...');
    if (firebaseUserId) {
      await completeRegistration(firebaseUserId);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    console.error('[Registration] Payment error:', errorMessage);
    setError(errorMessage);
  };

  // Skip payment and complete registration without subscription
  const handleRiddleSkip = () => {
    setRiddleDismissed(true);
  };

  const handleSkipPayment = async () => {
    if (!firebaseUserId) return;

    setIsSkippingPayment(true);
    setError('');

    try {
      console.log('[Registration] Skipping payment, completing registration without subscription...');
      await completeRegistration(firebaseUserId);
    } catch (err: any) {
      console.error('[Registration] Error skipping payment:', err);
      setError(err.message || 'Hiba történt. Kérjük, próbáld újra.');
      setIsSkippingPayment(false);
    }
  };

  // ============ COMPLETE REGISTRATION ============

  const completeRegistration = async (_userId: string) => {
    setLoading(true);
    try {
      // Use state data instead of sessionStorage (formData and pendingEmployees are in state)
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim()
      };

      // Call completeUnifiedRegistration Cloud Function
      const completeRegistrationFn = httpsCallable<UnifiedRegistrationInput, UnifiedRegistrationResponse>(
        functions,
        'completeUnifiedRegistration'
      );

      const result = await completeRegistrationFn({
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email,
        phone: registrationData.phone,
        companyName: registrationData.companyName,
        billingEmail: registrationData.email,
        preRegistrationId: preRegistrationData?.preRegistrationId
      });

      console.log('[Registration] Registration completed:', result.data);

      if (result.data.success) {
        // Send employee invites if any (from state, not sessionStorage)
        if (pendingEmployees && pendingEmployees.length > 0) {
          console.log('[Registration] Sending employee invites:', pendingEmployees.length);
          const addEmployee = httpsCallable<AddEmployeeInput, AddEmployeeResponse>(functions, 'addEmployee');

          for (const employee of pendingEmployees) {
            try {
              await addEmployee({
                companyId: result.data.companyId,
                email: employee.email,
                firstName: employee.firstName,
                lastName: employee.lastName
              });
              console.log(`[Registration] Invite sent to ${employee.email}`);
            } catch (inviteError: any) {
              console.error(`[Registration] Failed to invite ${employee.email}:`, inviteError);
            }
          }
        }

        // Force token refresh and update auth context
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.getIdToken(true);
          await currentUser.reload();
          await refreshUser(); // Update auth context/store with new claims
        }

        // Note: pendingRegistration cleanup happens in webhook/Cloud Function
        // No sessionStorage to clear - we use Firestore now

        // Set welcome popup flag
        sessionStorage.setItem('showWelcomePopup', 'true');

        // Redirect to dashboard
        if (inviteData) {
          router.push('/dashboard');
        } else {
          router.push('/vallalkozas/kezdolap');
        }
      }
    } catch (err: any) {
      console.error('[Registration] Complete registration error:', err);
      setError(err.message || 'Hiba történt a regisztráció befejezésekor');
      setLoading(false);
    }
  };

  // ============ RENDER ============

  // Invited employee: only Step 1
  const isInvitedEmployee = !!inviteData;
  const totalSteps = isInvitedEmployee ? 1 : 3;

  return (
    <div className="space-y-6">
      {/* Progress Bar - only show for normal registration */}
      {!isInvitedEmployee && (
        <RegistrationProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps as 1 | 3}
        />
      )}

      {/* Loading state while checking for pending registration */}
      {!recoveryChecked && user && !inviteData && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-brand-secondary" />
          <span className="ml-2 text-sm text-gray-600">Adatok betöltése...</span>
        </div>
      )}

      {/* Recovery Banner - show when resuming a pending registration */}
      {isRecovering && recoveryChecked && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Folytathatod a regisztrációt
              </p>
              <p className="text-xs text-blue-600">
                A korábban megadott adataid elmentettük. Folytasd onnan, ahol abbahagytad!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Browser Warning */}
      {isLegacyBrowser() && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Régebbi böngészőt használsz
              </p>
              <p className="text-xs text-amber-600">
                Az Internet Explorer és a régi Edge böngészők nem támogatottak.
                Kérjük, használj modern böngészőt (Chrome, Firefox, új Edge) a regisztrációhoz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company Invite Banner */}
      {inviteData && (
        <div className="p-4 bg-brand-secondary/5 border border-brand-secondary/20 rounded-lg">
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

      {/* Pre-Registration Banner */}
      {preRegistrationData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Előregisztráció: {preRegistrationData.companyName}
              </p>
              <p className="text-xs text-blue-600">
                Az adataid már ki vannak töltve - csak a jelszót kell megadnod
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ============ STEP 1: Personal Information ============ */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
              <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {preRegistrationData ? 'Regisztráció befejezése' : inviteData ? 'Regisztráció és csatlakozás' : 'Kezdjünk bele a kalandba'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {preRegistrationData ? 'Add meg a jelszavadat a regisztráció befejezéséhez' : inviteData ? 'Töltsd ki az adataidat' : ''}
              </p>
            </div>

            <div className="space-y-5">
              {/* Last Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lastName">
                  Vezetéknév {preRegistrationData && <span className="text-gray-500 text-xs">(előkitöltve)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    className={`form-input w-full py-3 sm:py-2.5 pl-10 ${preRegistrationData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Kovács"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    disabled={loading || !!preRegistrationData}
                    readOnly={!!preRegistrationData}
                  />
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="firstName">
                  Keresztnév {preRegistrationData && <span className="text-gray-500 text-xs">(előkitöltve)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    className={`form-input w-full py-3 sm:py-2.5 pl-10 ${preRegistrationData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="János"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    disabled={loading || !!preRegistrationData}
                    readOnly={!!preRegistrationData}
                  />
                </div>
              </div>

              {/* Company Name - Hidden for invited employees, pre-filled for pre-registration */}
              {!inviteData && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="companyName">
                    Cégnév {preRegistrationData ? <span className="text-gray-500 text-xs">(előkitöltve)</span> : <span className="text-gray-400 font-normal">(opcionális)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      type="text"
                      className={`form-input w-full py-3 sm:py-2.5 pl-10 ${preRegistrationData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Ha üresen hagyod, a neved lesz használva"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      disabled={loading || !!preRegistrationData}
                      readOnly={!!preRegistrationData}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                  Email cím {inviteData && <span className="text-gray-500 text-xs">(meghívóból)</span>}{preRegistrationData && <span className="text-gray-500 text-xs">(előkitöltve)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className={`form-input w-full py-3 sm:py-2.5 pl-10 ${(inviteData || preRegistrationData) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="pelda@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={loading || !!inviteData || !!preRegistrationData}
                    readOnly={!!inviteData || !!preRegistrationData}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
                  Telefonszám {preRegistrationData && <span className="text-gray-500 text-xs">(előkitöltve)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className={`form-input w-full py-3 sm:py-2.5 pl-10 ${preRegistrationData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="+36 30 123 4567"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={loading || !!preRegistrationData}
                    readOnly={!!preRegistrationData}
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
                    autoComplete="new-password"
                    className="form-input w-full py-3 sm:py-2.5 pl-10 pr-12"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
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
                    autoComplete="new-password"
                    className="form-input w-full py-3 sm:py-2.5 pl-10 pr-12"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Next Button */}
              <motion.button
                type="button"
                onClick={handleStep1Next}
                disabled={loading || checkingEmail}
                className="w-full py-3.5 sm:py-3 px-6 bg-gradient-to-t from-brand-secondary to-brand-secondary/50 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 touch-manipulation"
                whileTap={{ scale: 0.98 }}
              >
                {loading || checkingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {checkingEmail ? 'Ellenőrzés...' : 'Feldolgozás...'}
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
            </div>
          </motion.div>
        )}

        {/* ============ STEP 2: Colleagues ============ */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            ref={step2Ref}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Munkatársak meghívása
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Opcionális - maximum 5 munkatársat adhatsz hozzá
              </p>
            </div>

            <div className="space-y-5">
              {/* Employee Input Fields */}
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
                    className="form-input w-full py-3 sm:py-2.5 pl-10"
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
                    className="form-input w-full py-3 sm:py-2.5 pl-10"
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
                    inputMode="email"
                    autoComplete="email"
                    className="form-input w-full py-3 sm:py-2.5 pl-10"
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

              {/* Error/Success Messages */}
              {employeeError && (
                <p className="text-sm text-red-600">{employeeError}</p>
              )}
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
                    Munkatárs hozzáadása
                  </>
                )}
              </button>

              {/* Pending Employees List */}
              {pendingEmployees.length > 0 && (
                <div className="mt-4 space-y-2">
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
                        className="p-2.5 -m-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors touch-manipulation"
                        aria-label={`${employee.lastName} ${employee.firstName} eltávolítása`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // Note: Can't truly go back since Firebase user exists
                    // This just clears errors and shows a message
                    setError('A fiók már létrejött. Kérjük, folytasd a regisztrációt.');
                  }}
                  disabled={loading}
                  className="flex-1 py-3.5 sm:py-3 px-4 sm:px-6 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Vissza</span>
                </button>

                <button
                  type="button"
                  onClick={handleStep2Next}
                  disabled={loading}
                  className="flex-[2] sm:flex-1 py-3.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-t from-brand-secondary to-brand-secondary/50 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span className="text-sm sm:text-base">Tovább a fizetéshez</span>
                  <CreditCard className="w-5 h-5" />
                </button>
              </div>

              {/* Skip info */}
              <p className="text-center text-xs text-gray-500">
                Később is hozzáadhatsz munkatársakat a beállításokban
              </p>
            </div>
          </motion.div>
        )}

        {/* ============ STEP 3: Payment ============ */}
        {currentStep === 3 && firebaseUserId && (
          <motion.div
            key="step3"
            ref={step3Ref}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Fizetés
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                14.990 Ft/hó
              </p>
            </div>

            {!riddleDismissed && (
              <div className="mb-6">
                <RiddleDiscountCard onSkip={handleRiddleSkip} />
              </div>
            )}

            <StripeEmbeddedCheckout
              userId={firebaseUserId}
              email={formData.email}
              registrationData={{
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                companyName: formData.companyName.trim() || undefined,
                pendingEmployees: pendingEmployees
              }}
              onComplete={handlePaymentComplete}
              onError={handlePaymentError}
            />

            {/* Skip payment option */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleSkipPayment}
                disabled={isSkippingPayment || loading}
                className="text-sm text-gray-500 hover:text-gray-700 underline hover:no-underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSkippingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Feldolgozás...
                  </span>
                ) : (
                  'Később'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
