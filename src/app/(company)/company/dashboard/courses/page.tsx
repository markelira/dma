'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { db, functions as fbFunctions } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  BookOpen,
  Video,
  GraduationCap,
  Mic,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { PremiumCourseCard } from '@/components/courses/PremiumCourseCard';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { Company } from '@/types/company';

const COURSE_TYPE_ICONS: Record<string, any> = {
  ALL: BookOpen,
  ACADEMIA: GraduationCap,
  WEBINAR: Video,
  MASTERCLASS: BookOpen,
  PODCAST: Mic,
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  ALL: 'Minden',
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
};

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string;
  instructorName?: string;
  categoryId?: string;
  category?: string;
  level: string;
  duration: string;
  rating?: number;
  students?: number;
  enrollmentCount?: number;
  price?: number;
  thumbnailUrl?: string;
  lessons?: number;
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  createdAt?: any;
  tags?: string[];
  published?: boolean;
}

export default function CompanyCoursesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, authReady } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const { data: instructors = [] } = useInstructors();

  // Redirect if not logged in
  useEffect(() => {
    if (authReady && !authLoading && !user) {
      router.push('/login?redirect_to=/company/dashboard/courses');
    }
  }, [user, authLoading, authReady, router]);

  // Load company data
  useEffect(() => {
    const loadCompany = async () => {
      if (!user?.companyId) return;

      try {
        const companyRef = doc(db, 'companies', user.companyId);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          setCompany({ id: companySnap.id, ...companySnap.data() } as Company);
        }
      } catch (err) {
        console.error('Error loading company:', err);
      }
    };

    if (user?.companyId) {
      loadCompany();
    }
  }, [user]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const getCategories = httpsCallable(fbFunctions, 'getCategories');
        const result: any = await getCategories();
        if (result.data?.success && result.data?.categories) {
          setCategories(result.data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all courses
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];

      // Only show published courses
      const publishedCourses = coursesData.filter(c => c.published !== false);
      setCourses(publishedCourses);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching courses:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter courses by type and search
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by type
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(c => c.courseType === selectedType);
    }

    // Filter by search
    if (searchInput.trim()) {
      const search = searchInput.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [courses, selectedType, searchInput]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: courses.length,
      filtered: filteredCourses.length,
      byType: {
        ACADEMIA: courses.filter(c => c.courseType === 'ACADEMIA').length,
        WEBINAR: courses.filter(c => c.courseType === 'WEBINAR').length,
        MASTERCLASS: courses.filter(c => c.courseType === 'MASTERCLASS').length,
        PODCAST: courses.filter(c => c.courseType === 'PODCAST').length,
      }
    };
  }, [courses, filteredCourses]);

  if (authLoading || !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/company/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Vissza a vezérlőpulthoz
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center mt-2">
                  <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
                  Kurzusok böngészése
                </h1>
                {company && (
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Building2 className="w-4 h-4 mr-1" />
                    {company.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Kurzus keresése..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 bg-white/80 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-500" />
              {Object.entries(COURSE_TYPE_LABELS).map(([key, label]) => {
                const Icon = COURSE_TYPE_ICONS[key];
                const isActive = selectedType === key;
                const count = key === 'ALL' ? stats.total : stats.byType[key as keyof typeof stats.byType] || 0;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/80 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {label}
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                      isActive ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600">
          {filteredCourses.length} kurzus található
          {searchInput && ` "${searchInput}" kifejezésre`}
          {selectedType !== 'ALL' && ` - ${COURSE_TYPE_LABELS[selectedType]}`}
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Kurzusok betöltése...</p>
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nincs találat
            </h3>
            <p className="text-gray-600 mb-4">
              {searchInput
                ? 'Próbálj más keresési kifejezést használni.'
                : 'Jelenleg nincs elérhető kurzus ebben a kategóriában.'}
            </p>
            {(searchInput || selectedType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSelectedType('ALL');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Szűrők törlése
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <PremiumCourseCard
                key={course.id}
                course={course}
                index={index}
                categories={categories}
                instructors={instructors}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
