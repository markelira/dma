'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { colors, cardStyles } from '@/lib/design-tokens-premium';
import { Company, CompanyAdmin, DashboardStats } from '@/types/company';

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

        {/* Trial Banner */}
        {company.plan === 'trial' && daysRemaining > 0 && (
          <div className="mb-8 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Próbaidőszak</p>
                <p className="text-sm text-amber-700">Még {daysRemaining} nap van hátra a próbaidőszakból</p>
              </div>
            </div>
            <Link
              href="/company/dashboard/billing"
              className="btn-sm bg-gradient-to-t from-amber-600 to-amber-500 text-white shadow-sm hover:shadow-md transition-all"
            >
              Frissítés
            </Link>
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
      </div>
    </div>
  );
}
