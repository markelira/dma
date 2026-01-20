'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from "motion/react"
import { BookOpen, Loader2 } from 'lucide-react'
import { db, functions as fbFunctions } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { AuthProvider } from '@/contexts/AuthContext'
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper'
import Footer from '@/components/landing-home/ui/footer'
import { DashboardHeroCarousel } from '@/components/dashboard/DashboardHeroCarousel'
import { DashboardSearch, DashboardFilters } from '@/components/dashboard/DashboardSearch'
import { CourseCarouselRow } from '@/components/dashboard/CourseCarouselRow'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { useEnrollments } from '@/hooks/useEnrollments'
import { sortByContentCreatedAt, shufflePopularCourses } from '@/lib/carouselUtils'
import { shuffleArray } from '@/lib/utils'

interface Course {
  id: string
  title: string
  description: string
  instructorId?: string
  instructorIds?: string[]
  instructorName?: string
  categoryId?: string
  categoryIds?: string[]
  category?: string
  targetAudienceIds?: string[]
  level: string
  duration: string
  rating?: number
  students?: number
  enrollmentCount?: number
  price?: number
  thumbnailUrl?: string
  lessons?: number
  courseType: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
  createdAt?: any
  tags?: string[]
}

// Helper to get first lesson ID from course (flat lessons array)
function getFirstLessonId(course: Course): string | undefined {
  const lessons = (course as any).lessons || [];
  if (lessons.length === 0) return undefined;

  const sortedLessons = [...lessons]
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .filter((l: any) => l.status === 'PUBLISHED' || !l.status);

  return sortedLessons.length > 0 ? sortedLessons[0].id : undefined;
}

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [targetAudiences, setTargetAudiences] = useState<Array<{ id: string; name: string }>>([])
  const [activeFilters, setActiveFilters] = useState<DashboardFilters>({
    query: '',
    categoryIds: [],
    audienceIds: [],
    courseTypes: [],
    instructorIds: [],
  })
  const { data: instructors = [] } = useInstructors()
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments()

  // Auto-select category from URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam && categories.length > 0) {
      // Check if the category ID exists in our categories
      const categoryExists = categories.find(c => c.id === categoryParam)
      if (categoryExists && !activeFilters.categoryIds.includes(categoryParam)) {
        setActiveFilters(prev => ({
          ...prev,
          categoryIds: [categoryParam]
        }))
      }
    }
  }, [searchParams, categories, activeFilters.categoryIds])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const getCategories = httpsCallable(fbFunctions, 'getCategories')
        const result: any = await getCategories()
        if (result.data?.success && result.data?.categories) {
          // Fix sorrend: Ügyvezetés, HR, Marketing, Értékesítés, Működés
          const CATEGORY_ORDER = ['Ügyvezetés', 'HR', 'Marketing', 'Értékesítés', 'Működés'];
          const sorted = [...result.data.categories].sort((a: any, b: any) => {
            const indexA = CATEGORY_ORDER.indexOf(a.name);
            const indexB = CATEGORY_ORDER.indexOf(b.name);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          setCategories(sorted)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch target audiences
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'targetAudiences'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name as string
        }))
        setTargetAudiences(data)
      },
      (error) => {
        console.error('Error fetching target audiences:', error)
      }
    )
    return () => unsubscribe()
  }, [])

  // Fetch all courses (no status filter - just like webinar page)
  useEffect(() => {
    const coursesQuery = query(
      collection(db, 'courses'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[]

      console.log('✅ Fetched courses:', coursesData.length)
      console.log('📊 Courses by type:', {
        ACADEMIA: coursesData.filter(c => c.courseType === 'ACADEMIA').length,
        WEBINAR: coursesData.filter(c => c.courseType === 'WEBINAR').length,
        MASTERCLASS: coursesData.filter(c => c.courseType === 'MASTERCLASS').length,
        PODCAST: coursesData.filter(c => c.courseType === 'PODCAST').length,
      })

      setCourses(coursesData)
      setLoading(false)
    }, (error) => {
      console.error('❌ Error fetching courses:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Check if any filters are active
  const hasActiveFilters = activeFilters.query ||
    activeFilters.categoryIds.length > 0 ||
    activeFilters.audienceIds.length > 0 ||
    activeFilters.courseTypes.length > 0 ||
    activeFilters.instructorIds.length > 0;

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!courses || !hasActiveFilters) return null;

    let results = [...courses];

    // Search query
    if (activeFilters.query) {
      const searchLower = activeFilters.query.toLowerCase();
      results = results.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Categories (OR logic)
    if (activeFilters.categoryIds.length > 0) {
      results = results.filter(course => {
        return activeFilters.categoryIds.some(catId => {
          if (course.categoryIds?.includes(catId)) return true;
          if ((course as any).category?.id === catId) return true;
          if ((course as any).categoryId === catId) return true;
          return false;
        });
      });
    }

    // Target Audiences (OR logic)
    if (activeFilters.audienceIds.length > 0) {
      results = results.filter(course =>
        activeFilters.audienceIds.some(audId => course.targetAudienceIds?.includes(audId))
      );
    }

    // Course Types (OR logic)
    if (activeFilters.courseTypes.length > 0) {
      results = results.filter(course =>
        activeFilters.courseTypes.includes(course.courseType)
      );
    }

    // Instructors (OR logic)
    if (activeFilters.instructorIds.length > 0) {
      results = results.filter(course =>
        activeFilters.instructorIds.some(instId =>
          (course as any).instructorId === instId ||
          (course as any).instructorIds?.includes(instId)
        )
      );
    }

    return results.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
  }, [courses, hasActiveFilters, activeFilters])

  // Helper to get instructor names
  const getInstructorNames = (course: Course): string[] => {
    if (!instructors) return [];
    const names: string[] = [];

    if (course.instructorId) {
      const instructor = instructors.find(i => i.id === course.instructorId);
      if (instructor?.name) names.push(instructor.name);
    }

    if ((course as any).instructorIds?.length) {
      (course as any).instructorIds.forEach((id: string) => {
        const instructor = instructors.find(i => i.id === id);
        if (instructor?.name && !names.includes(instructor.name)) {
          names.push(instructor.name);
        }
      });
    }

    return names;
  };

  // Build hero slides - 5 random shuffled courses
  const heroSlides = useMemo(() => {
    if (!courses || courses.length === 0) return [];

    // Shuffle courses randomly and take 5 for hero
    const randomCourses = shuffleArray(courses).slice(0, 5);

    return randomCourses.map(course => {
      const enrollment = enrollments?.find(e => e.courseId === course.id);
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        courseType: course.courseType,
        instructorNames: getInstructorNames(course),
        duration: course.duration,
        progress: enrollment?.progress,
        isEnrolled: !!enrollment,
        currentLessonId: enrollment?.currentLessonId,
        firstLessonId: enrollment?.firstLessonId || getFirstLessonId(course),
      };
    });
  }, [courses, enrollments, instructors])

  // Popular courses (top by enrollment count)
  const popularCourses = useMemo(() => {
    if (!courses) return [];
    return shufflePopularCourses(courses, 10);
  }, [courses]);

  // Newest courses (sorted by createdAt)
  const newestCourses = useMemo(() => {
    if (!courses) return [];
    return sortByContentCreatedAt(courses).slice(0, 10);
  }, [courses]);

  // Category rows
  const categoryRows = useMemo(() => {
    if (!categories || !courses) return [];

    return categories
      .map(category => {
        const categoryCourses = courses.filter(course => {
          if (course.categoryIds?.includes(category.id)) return true;
          if ((course as any).category?.id === category.id) return true;
          if ((course as any).categoryId === category.id) return true;
          return false;
        });
        return {
          category,
          courses: shuffleArray(categoryCourses),
        };
      })
      .filter(row => row.courses.length > 0);
  }, [categories, courses]);

  // Fallback section check
  const showFallbackSection = useMemo(() => {
    return courses && courses.length > 0 && categoryRows.length === 0;
  }, [courses, categoryRows])

  const isLoading = loading || enrollmentsLoading;

  if (isLoading) {
    return (
      <AuthProvider>
        <FramerNavbarWrapper />
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-secondary" />
        </div>
        <Footer border={true} />
      </AuthProvider>
    )
  }

  // Filter change handler
  const handleFilterChange = (filters: DashboardFilters) => {
    setActiveFilters(filters);
  }

  return (
    <AuthProvider>
      <FramerNavbarWrapper />
      <main className="min-h-screen bg-gray-50">
        <div className="space-y-8 px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          {/* Hero Carousel */}
          {heroSlides.length > 0 && (
            <DashboardHeroCarousel slides={heroSlides} />
          )}

          {/* Search and Filter */}
          <DashboardSearch
            className="my-2"
            onFilterChange={handleFilterChange}
          />

          {/* Filtered Results - shown when filters are active */}
          {hasActiveFilters && filteredCourses && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Találatok ({filteredCourses.length})
                </h2>
                <button
                  onClick={() => setActiveFilters({ query: '', categoryIds: [], audienceIds: [], courseTypes: [], instructorIds: [] })}
                  className="text-sm text-brand-secondary hover:text-brand-secondary/80"
                >
                  Szűrők törlése
                </button>
              </div>
              {filteredCourses.length > 0 ? (
                <CourseCarouselRow
                  title=""
                  courses={filteredCourses}
                  categories={categories || []}
                  instructors={instructors || []}
                  enrollments={enrollments || []}
                />
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">Nincs találat a szűrőknek megfelelő tartalom</p>
                </div>
              )}
            </div>
          )}

          {/* Regular content - hidden when filters are active */}
          {!hasActiveFilters && (
            <>
              {/* Felkapott tartalmak - most popular */}
              {popularCourses.length > 0 && (
                <CourseCarouselRow
                  title="Felkapott tartalmak"
                  courses={popularCourses}
                  categories={categories || []}
                  instructors={instructors || []}
                  enrollments={enrollments || []}
                  viewAllLink="/courses"
                />
              )}

              {/* Legújabb tartalmak */}
              {newestCourses.length > 0 && (
                <CourseCarouselRow
                  title="Legújabb tartalmak"
                  courses={newestCourses}
                  categories={categories || []}
                  instructors={instructors || []}
                  enrollments={enrollments || []}
                />
              )}

              {/* Category Carousels */}
              {categoryRows.map(({ category, courses: categoryCourses }) => (
                <CourseCarouselRow
                  key={category.id}
                  title={category.name}
                  courses={categoryCourses}
                  categories={categories || []}
                  instructors={instructors || []}
                  enrollments={enrollments || []}
                  viewAllLink={`/courses?category=${category.id}`}
                />
              ))}

              {/* Fallback: All Courses if no categories matched */}
              {showFallbackSection && courses && (
                <CourseCarouselRow
                  title="Felfedezés"
                  courses={[...courses].sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))}
                  categories={categories || []}
                  instructors={instructors || []}
                  enrollments={enrollments || []}
                  viewAllLink="/courses"
                />
              )}

              {/* Course Type Carousels */}
              {courses && ['WEBINAR', 'ACADEMIA', 'MASTERCLASS', 'PODCAST'].map(type => {
                const typeCourses = shuffleArray(courses.filter(c => c.courseType === type));
                if (typeCourses.length === 0) return null;

                const typeLabels: Record<string, string> = {
                  'WEBINAR': 'Webinár',
                  'ACADEMIA': 'Akadémia',
                  'MASTERCLASS': 'Masterclass',
                  'PODCAST': 'Podcast'
                };

                return (
                  <CourseCarouselRow
                    key={type}
                    title={typeLabels[type]}
                    courses={typeCourses}
                    categories={categories || []}
                    instructors={instructors || []}
                    enrollments={enrollments || []}
                    viewAllLink={`/${type.toLowerCase()}`}
                  />
                );
              })}
            </>
          )}
        </div>
      </main>
      <Footer border={true} />
    </AuthProvider>
  )
}
