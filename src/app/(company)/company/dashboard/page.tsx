'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Star,
  ArrowRight,
  Plus,
  BookOpen,
  Loader2,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Company, CompanyAdmin, DashboardStats } from '@/types/company';
import { useEnrollCompanyInCourse, useCompanyEnrolledCourses } from '@/hooks/useCompanyActions';
import { usePaymentActions } from '@/hooks/usePaymentActions';
import { StatCard } from '@/components/dashboard/StatCard';

// Stripe Price ID for company subscription
const COMPANY_SUBSCRIPTION_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1SNAlsGe8tBqGEXM8vEOVhgY';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, authReady } = useAuthStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [admin, setAdmin] = useState<CompanyAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        const companyId = user.companyId;

        if (!companyId) {
          setError('Nem található vállalati fiók');
          setLoading(false);
          return;
        }

        // Get company document
        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (!companySnap.exists()) {
          setError('Nem található vállalati fiók');
          setLoading(false);
          return;
        }

        const userCompany: Company = {
          id: companySnap.id,
          ...companySnap.data() as Omit<Company, 'id'>
        };

        // Get admin document
        const adminRef = doc(db, 'companies', companyId, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
          setError('Nincs admin jogosultságod');
          setLoading(false);
          return;
        }

        const userAdmin = adminSnap.data() as CompanyAdmin;

        setCompany(userCompany);
        setAdmin(userAdmin);

        // Fetch basic stats
        const employeesRef = collection(db, 'companies', userCompany.id, 'employees');
        const employeesSnapshot = await getDocs(employeesRef);

        const activeCount = employeesSnapshot.docs.filter(doc => doc.data().status === 'active').length;
        const invitedCount = employeesSnapshot.docs.filter(doc => doc.data().status === 'invited').length;

        const masterclassesRef = collection(db, 'companies', userCompany.id, 'masterclasses');
        const masterclassesSnapshot = await getDocs(masterclassesRef);

        // Fetch progress analytics from Cloud Function
        try {
          const getDashboard = httpsCallable(functions, 'getCompanyDashboard');
          const result = await getDashboard({ companyId: userCompany.id });
          const dashboardData = result.data as any;

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
          console.error('Error fetching dashboard analytics:', err);
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
          setCoursesLoading(true);
          const coursesSnapshot = await getDocs(collection(db, 'courses'));
          const courses = coursesSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter((course: any) => course.published === true);
          setAvailableCourses(courses);
        } catch (err) {
          console.error('Error fetching courses:', err);
        } finally {
          setCoursesLoading(false);
        }

      } catch (err: any) {
        console.error('Error fetching company data:', err);
        setError('Hiba történt az adatok betöltése során');
      } finally {
        setLoading(false);
      }
    };

    if (authReady && !authLoading) {
      if (user?.companyId) {
        fetchCompanyData();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, authReady, router]);

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

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
    }
  };

  // Get courses not yet enrolled
  const availableCoursesForEnrollment = availableCourses.filter(
    course => !enrolledCourses.some(ec => ec.id === course.id)
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-white0" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error || !company || !admin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Nincs vállalati fiók'}
          </h2>
          <p className="text-gray-600 mb-6">
            Úgy tűnik, még nincs vállalati fiókod, vagy nem vagy admin.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-secondary text-white rounded-lg font-medium hover:bg-brand-secondary-hover transition-colors"
          >
            Vállalat regisztrálása
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Üdv, {admin.name}!
        </h1>
        <p className="text-gray-500">
          Itt kezelheted a vállalat alkalmazottait és követheted a tanulási előrehaladást
        </p>
      </div>

      {/* Subscription Banner */}
      {!hasActiveSubscription && !subscriptionStatusLoading && (
        <div className="rounded-xl bg-gradient-to-r from-brand-secondary/5 to-purple-50 border border-brand-secondary/20 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-secondary/50 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Aktiváld az előfizetésedet</h3>
                <p className="text-gray-600 mt-1">
                  Az előfizetéssel korlátlan hozzáférést biztosíthatsz az összes tartalomhoz minden alkalmazottad számára.
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    Korlátlan hozzáférés minden tartalomhoz
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
              className="px-6 py-3 bg-brand-secondary text-white rounded-lg font-medium hover:bg-brand-secondary-hover transition-colors inline-flex items-center justify-center whitespace-nowrap disabled:opacity-50 shadow-sm"
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
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
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
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center justify-between">
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Összes alkalmazott"
          value={stats.totalEmployees}
          isLoading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Aktív alkalmazottak"
          value={stats.activeEmployees}
          isLoading={loading}
        />
        <StatCard
          icon={Clock}
          label="Meghívott"
          value={stats.invitedEmployees}
          isLoading={loading}
        />
        <StatCard
          icon={Target}
          label="Átlagos haladás"
          value={stats.averageProgress}
          suffix="%"
          isLoading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Gyors műveletek
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/company/dashboard/employees"
            className="group flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-brand-secondary/5 hover:border-brand-secondary/20 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-secondary/20 transition-colors">
              <Users className="w-5 h-5 text-brand-secondary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Alkalmazott hozzáadása</p>
              <p className="text-xs text-gray-500">Új munkatárs meghívása</p>
            </div>
          </Link>

          <Link
            href="/company/dashboard/courses"
            className="group flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Tartalmak böngészése</p>
              <p className="text-xs text-gray-500">Minden elérhető tartalom</p>
            </div>
          </Link>

          <Link
            href="/company/dashboard/progress"
            className="group flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Riportok megtekintése</p>
              <p className="text-xs text-gray-500">Előrehaladás követése</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Company Courses Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-brand-secondary" />
            Vállalati tartalmak
          </h2>
          <button
            onClick={() => setShowAddCourseModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-brand-secondary text-white rounded-lg hover:bg-brand-secondary-hover transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tartalom hozzáadása
          </button>
        </div>

        {enrolledCoursesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-secondary" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Még nincs tartalom hozzáadva</p>
            <p className="text-sm text-gray-500 mt-1">Adj hozzá tartalmakat, hogy az alkalmazottak elkezdhenek tanulni.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
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
                  <div className="aspect-video bg-gradient-to-br from-brand-secondary/10 to-purple-100 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-brand-secondary" />
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

      {/* Add Course Modal */}
      <AnimatePresence>
        {showAddCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowAddCourseModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Tartalom hozzáadása</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Válassz ki egy tartalmat, amelyre be szeretnéd iratkoztatni az alkalmazottakat.
                </p>
              </div>
              <div className="p-6 max-h-[50vh] overflow-y-auto">
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-secondary" />
                  </div>
                ) : availableCoursesForEnrollment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nincs elérhető tartalom</p>
                    <p className="text-sm mt-1">Minden tartalmat már hozzáadtál.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableCoursesForEnrollment.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`w-full flex items-center p-3 rounded-lg border transition-all text-left ${
                          selectedCourseId === course.id
                            ? 'border-brand-secondary bg-brand-secondary/5 ring-2 ring-brand-secondary/20'
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
                          <div className="w-16 h-12 rounded bg-gradient-to-br from-brand-secondary/10 to-purple-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-brand-secondary" />
                          </div>
                        )}
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{course.title}</p>
                          <p className="text-sm text-gray-500">
                            {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || course.lessonCount || 0} lecke
                          </p>
                        </div>
                        {selectedCourseId === course.id && (
                          <CheckCircle2 className="w-5 h-5 text-brand-secondary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-lg hover:bg-brand-secondary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
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
