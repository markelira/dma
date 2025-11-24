'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Target,
  ShoppingCart,
  Star,
  ArrowRight,
  Plus,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { colors, cardStyles } from '@/lib/design-tokens-premium';
import { Company, CompanyAdmin, DashboardStats } from '@/types/company';
import { useEnrollCompanyInCourse, useCompanyEnrolledCourses } from '@/hooks/useCompanyActions';
import { usePaymentActions } from '@/hooks/usePaymentActions';

// Stripe Price ID for company subscription (from .env)
const COMPANY_SUBSCRIPTION_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1QWPDjRvOWrujGVHxdaSOcJZ';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, authReady, logout } = useAuthStore();

  console.log('🔍 [RESEARCH] Company Dashboard mounted:', {
    authReady,
    authLoading,
    hasUser: !!user,
    userRole: user?.role,
    companyId: user?.companyId,
    companyRole: user?.companyRole,
    userObject: user
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [admin, setAdmin] = useState<CompanyAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    invitedEmployees: 0,
    totalMasterclasses: 0,
    atRiskCount: 0,
    completedCourses: 0,
    averageProgress: 0,
  });
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Company course enrollment hooks
  const enrollCompanyMutation = useEnrollCompanyInCourse();
  const { data: enrolledCourses = [], isLoading: enrolledCoursesLoading } = useCompanyEnrolledCourses(company?.id);

  // Subscription hooks
  const {
    subscriptionStatus,
    subscriptionStatusLoading,
    subscribeToPlan,
    isCreatingCheckout
  } = usePaymentActions();

  // Check if company has active subscription
  const hasActiveSubscription = subscriptionStatus?.hasSubscription && subscriptionStatus?.isActive;
  const isTrialing = subscriptionStatus?.subscription?.status === 'trialing';

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user) {
        router.push('/login?redirect_to=/company/dashboard');
        return;
      }

      try {
        const db = getFirestore();

        // Get companyId from user custom claims
        const companyId = user.companyId;
        console.log('🔍 [RESEARCH] Company Dashboard user data:', {
          companyId: companyId,
          hasCompanyId: !!companyId,
          userRole: user.role,
          companyRole: user.companyRole,
          fullUser: user
        });

        if (!companyId) {
          console.error('❌ [RESEARCH] No companyId found! User object:', user);
          setError('Nem található vállalati fiók');
          setLoading(false);
          return;
        }

        // Get company document
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          console.error('[Company Dashboard] Company document not found:', companyId);
          setError('Nem található vállalati fiók');
          setLoading(false);
          return;
        }

        console.log('[Company Dashboard] Company document loaded');

        const userCompany: Company = {
          id: companySnap.id,
          ...companySnap.data() as Omit<Company, 'id'>
        };

        // Get admin document
        const adminRef = doc(db, 'companies', companyId, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          console.error('[Company Dashboard] Admin document not found for user:', user.uid);
          setError('Nincs admin jogosultságod');
          setLoading(false);
          return;
        }

        console.log('[Company Dashboard] Admin document loaded');

        const userAdmin = adminSnap.data() as CompanyAdmin;

        setCompany(userCompany);
        setAdmin(userAdmin);

        // Fetch basic stats
        console.log('[Company Dashboard] Fetching employees...');
        const employeesRef = collection(db, 'companies', userCompany.id, 'employees');
        const employeesSnapshot = await getDocs(employeesRef);
        console.log('[Company Dashboard] Employees loaded:', employeesSnapshot.size);

        const activeCount = employeesSnapshot.docs.filter(doc => doc.data().status === 'active').length;
        const invitedCount = employeesSnapshot.docs.filter(doc => doc.data().status === 'invited').length;

        console.log('[Company Dashboard] Fetching masterclasses...');
        const masterclassesRef = collection(db, 'companies', userCompany.id, 'masterclasses');
        const masterclassesSnapshot = await getDocs(masterclassesRef);
        console.log('[Company Dashboard] Masterclasses loaded:', masterclassesSnapshot.size);

        // Fetch progress analytics from Cloud Function
        try {
          console.log('[Company Dashboard] Calling getCompanyDashboard Cloud Function...');
          const getDashboard = httpsCallable(functions, 'getCompanyDashboard');
          const result = await getDashboard({ companyId: userCompany.id });
          const dashboardData = result.data as any;
          console.log('[Company Dashboard] Cloud Function response received');

          setStats({
            totalEmployees: employeesSnapshot.size,
            activeEmployees: activeCount,
            invitedEmployees: invitedCount,
            totalMasterclasses: masterclassesSnapshot.size,
            atRiskCount: dashboardData.stats?.atRiskCount || 0,
            completedCourses: dashboardData.stats?.completedCourses || 0,
            averageProgress: Math.round(dashboardData.stats?.averageProgress || 0),
          });
        } catch (err) {
          console.error('[Company Dashboard] Error fetching dashboard analytics:', err);
          // Fallback to basic stats if analytics fail
          setStats({
            totalEmployees: employeesSnapshot.size,
            activeEmployees: activeCount,
            invitedEmployees: invitedCount,
            totalMasterclasses: masterclassesSnapshot.size,
            atRiskCount: 0,
            completedCourses: 0,
            averageProgress: 0,
          });
        }

        // Fetch available courses for purchase
        try {
          console.log('[Company Dashboard] Fetching available courses...');
          setCoursesLoading(true);
          const coursesSnapshot = await getDocs(collection(db, 'courses'));
          const courses = coursesSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter((course: any) => course.published === true);

          console.log(`[Company Dashboard] Loaded ${courses.length} available courses`);
          setAvailableCourses(courses);
        } catch (err) {
          console.error('[Company Dashboard] Error fetching courses:', err);
        } finally {
          setCoursesLoading(false);
        }

        console.log('[Company Dashboard] All data loaded successfully');

      } catch (err: any) {
        console.error('Error fetching company data:', err);
        setError('Hiba történt az adatok betöltése során');
      } finally {
        setLoading(false);
      }
    };

    // Wait for auth to be ready and user to have companyId
    if (authReady && !authLoading) {
      if (user?.companyId) {
        console.log('[Company Dashboard] Conditions met, fetching data...');
        fetchCompanyData();
      } else {
        console.log('[Company Dashboard] Auth ready but no companyId, stopping loading');
        setLoading(false);
      }
    }
  }, [user, authLoading, authReady, router]);

  const getDaysRemaining = () => {
    if (!company || !company.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = company.trialEndsAt.toDate();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourseId || !company?.id) return;

    try {
      await enrollCompanyMutation.mutateAsync({
        companyId: company.id,
        courseId: selectedCourseId,
      });
      setShowAddCourseModal(false);
      setSelectedCourseId(null);
    } catch (err) {
      console.error('Error enrolling company in course:', err);
    }
  };

  const handleSubscribe = async () => {
    console.log('[Subscription] handleSubscribe called');
    console.log('[Subscription] Price ID:', COMPANY_SUBSCRIPTION_PRICE_ID);
    console.log('[Subscription] Company ID:', company?.id);

    try {
      const result = await subscribeToPlan(
        COMPANY_SUBSCRIPTION_PRICE_ID,
        `${window.location.origin}/company/dashboard?subscription=success`,
        `${window.location.origin}/company/dashboard?subscription=cancelled`,
        {
          companyId: company?.id || '',
          subscriptionType: 'company'
        }
      );
      console.log('[Subscription] Result:', result);

      // If redirect didn't happen automatically, try manual redirect
      if (result?.url) {
        console.log('[Subscription] Manually redirecting to:', result.url);
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('[Subscription] Error creating checkout session:', err);
    }
  };

  // Get courses not yet enrolled
  const availableCoursesForEnrollment = availableCourses.filter(
    course => !enrolledCourses.some(ec => ec.id === course.id)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !company || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {error || 'Nincs vállalati fiók'}
          </h2>
          <p className="text-gray-600 mb-6">
            Úgy tűnik, még nincs vállalati fiókod, vagy nem vagy admin.
          </p>
          <Link
            href="/register"
            className="btn inline-flex items-center justify-center bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm hover:shadow-md transition-all"
          >
            Vállalat regisztrálása
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Company Name */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex-shrink-0">
                <img
                  src="/navbar-icon.png"
                  alt="DMA"
                  className="h-8"
                />
              </Link>
              <div className="hidden md:block h-6 w-px bg-gray-300/50"></div>
              <div className="hidden md:flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-900">{company.name}</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/company/dashboard" className="text-sm text-blue-600 font-medium">
                Áttekintés
              </Link>
              <Link href="/company/dashboard/employees" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Alkalmazottak
              </Link>
              <Link href="/company/dashboard/masterclasses" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Masterclassok
              </Link>
              <Link href="/company/dashboard/progress" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                Haladás
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Kijelentkezés</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100/50"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/20 bg-white/80 backdrop-blur-xl"
            >
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center space-x-2 pb-3 border-b border-gray-200/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900">{company.name}</span>
                </div>
                <Link href="/company/dashboard" className="block w-full text-left px-3 py-2 text-sm text-blue-600 font-medium bg-blue-50/50 rounded-lg">
                  Áttekintés
                </Link>
                <Link href="/company/dashboard/employees" className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50/50 rounded-lg">
                  Alkalmazottak
                </Link>
                <Link href="/company/dashboard/masterclasses" className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50/50 rounded-lg">
                  Masterclassok
                </Link>
                <Link href="/company/dashboard/progress" className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50/50 rounded-lg">
                  Haladás
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50/50 rounded-lg flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Kijelentkezés</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Üdv, {admin.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Itt kezelheted a vállalat alkalmazottait és követheted a tanulási előrehaladást
          </p>
        </div>

        {/* Subscription Banner */}
        {!hasActiveSubscription && !subscriptionStatusLoading && (
          <div className="mb-8 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Aktiváld az előfizetésedet</h3>
                  <p className="text-gray-600 mt-1">
                    Az előfizetéssel korlátlan hozzáférést biztosíthatsz az összes kurzushoz minden alkalmazottad számára.
                  </p>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      Korlátlan hozzáférés minden kurzushoz
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      7 napos ingyenes próbaidőszak
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      Bármikor lemondható
                    </li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleSubscribe}
                disabled={isCreatingCheckout}
                className="btn bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center whitespace-nowrap disabled:opacity-50"
              >
                {isCreatingCheckout ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Betöltés...
                  </>
                ) : (
                  <>
                    Előfizetés indítása
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Trial/Active Subscription Banner */}
        {hasActiveSubscription && isTrialing && (
          <div className="mb-8 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Próbaidőszak aktív</p>
                <p className="text-sm text-amber-700">
                  {subscriptionStatus?.subscription?.trialEnd
                    ? `A próbaidőszak lejár: ${new Date(subscriptionStatus.subscription.trialEnd).toLocaleDateString('hu-HU')}`
                    : 'A próbaidőszak hamarosan lejár'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
              Próba
            </span>
          </div>
        )}

        {hasActiveSubscription && !isTrialing && (
          <div className="mb-8 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Aktív előfizetés</p>
                <p className="text-sm text-green-700">
                  {subscriptionStatus?.subscription?.planName || 'DMA Vállalati előfizetés'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Aktív
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Összes alkalmazott</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Active Employees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktív</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Invited Employees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meghívott</p>
                <p className="text-3xl font-bold text-amber-600">{stats.invitedEmployees}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Total Masterclasses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Masterclassok</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalMasterclasses}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Gyors műveletek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/company/dashboard/employees" className="group flex items-center space-x-3 p-4 bg-white/50 border border-gray-200/50 rounded-lg hover:bg-white/80 hover:border-blue-300 hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Alkalmazott hozzáadása</p>
                <p className="text-xs text-gray-600">Új munkatárs meghívása</p>
              </div>
            </Link>

            <Link href="/company/dashboard/masterclasses" className="group flex items-center space-x-3 p-4 bg-white/50 border border-gray-200/50 rounded-lg hover:bg-white/80 hover:border-purple-300 hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Masterclass kezelése</p>
                <p className="text-xs text-gray-600">Képzések és hozzárendelések</p>
              </div>
            </Link>

            <Link href="/company/dashboard/progress" className="group flex items-center space-x-3 p-4 bg-white/50 border border-gray-200/50 rounded-lg hover:bg-white/80 hover:border-green-300 hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Riportok megtekintése</p>
                <p className="text-xs text-gray-600">Előrehaladás követése</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Company Courses Section */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              Vállalati kurzusok
            </h2>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-t from-blue-600 to-blue-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              Kurzus hozzáadása
            </button>
          </div>

          {enrolledCoursesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Még nincs kurzus hozzáadva</p>
              <p className="text-sm mt-1">Adj hozzá kurzusokat, hogy az alkalmazottak elkezdhenek tanulni.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white/50 border border-gray-200/50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {course.thumbnail ? (
                    <div className="aspect-video relative">
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-blue-400" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{course.title}</h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{course.lessonCount || 0} lecke</span>
                      <span>{course.employeeCount || 0} beiratkozott</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showAddCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddCourseModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Kurzus hozzáadása</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Válassz ki egy kurzust, amelyre be szeretnéd iratkoztatni az alkalmazottakat.
                </p>
              </div>
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : availableCoursesForEnrollment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nincs elérhető kurzus</p>
                    <p className="text-sm mt-1">Minden kurzust már hozzáadtál.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableCoursesForEnrollment.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`w-full flex items-center p-3 rounded-lg border transition-all text-left ${
                          selectedCourseId === course.id
                            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {course.thumbnail ? (
                          <div className="w-16 h-12 relative rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={course.thumbnail}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-blue-400" />
                          </div>
                        )}
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{course.title}</p>
                          <p className="text-sm text-gray-500">
                            {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || course.lessonCount || 0} lecke
                          </p>
                        </div>
                        {selectedCourseId === course.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddCourseModal(false);
                    setSelectedCourseId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Mégse
                </button>
                <button
                  onClick={handleEnrollCourse}
                  disabled={!selectedCourseId || enrollCompanyMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-t from-blue-600 to-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {enrollCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Beiratkoztatás...
                    </>
                  ) : (
                    'Alkalmazottak beiratkoztatása'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
