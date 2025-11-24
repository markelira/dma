'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Play, Clock, CheckCircle, BookOpen, Search, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { UserProgressData, EnrolledCourse } from '@/types'
import { brandGradient, buttonStyles, cardStyles } from '@/lib/design-tokens'

/**
 * Continue Learning Section
 * Priority section showing in-progress courses sorted by engagement score
 */

interface ContinueLearningProps {
  data: UserProgressData | null;
  isLoading?: boolean;
}

function ContinueLearningLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContinueLearningSection({ data, isLoading = false }: ContinueLearningProps) {
  // Show loading skeleton
  if (isLoading) {
    return <ContinueLearningLoadingSkeleton />;
  }

  // Filter and get top 3 in-progress courses (already sorted by priority score)
  const inProgressCourses = data?.enrolledCourses?.filter((course: EnrolledCourse) => 
    course.completionPercentage > 0 && course.completionPercentage < 100
  ).slice(0, 3) || []

  // Check if user has any enrolled courses at all
  const hasEnrolledCourses = (data?.enrolledCourses?.length || 0) > 0;
  const completedCourses = data?.enrolledCourses?.filter((course: EnrolledCourse) => 
    course.completionPercentage === 100
  ) || []

  // If no enrolled courses at all, don't show this section
  if (!hasEnrolledCourses) {
    return null;
  }

  if (inProgressCourses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Tanulás folytatása</h2>
        <div className="rounded-2xl p-8 text-center relative overflow-hidden" style={{ background: brandGradient }}>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Szuper! Minden tartalmat teljesített!
              </h3>
              <p className="text-white/90 mb-6 max-w-md mx-auto">
                Gratulálunk! {completedCourses.length} tartalmat sikeresen befejezett.
                Fedezzen fel új területeket és fejlessze tovább tudását.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/courses">
                  <button className={buttonStyles.primaryDark}>
                    <BookOpen className="w-5 h-5" />
                    <span>Új tartalmak keresése</span>
                  </button>
                </Link>
                <Link href="/dashboard/certificates">
                  <button className={buttonStyles.secondaryDark}>
                    <CheckCircle className="w-5 h-5" />
                    <span>Tanúsítványok megtekintése</span>
                  </button>
                </Link>
              </div>
            </div>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08), transparent 70%)'
            }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tanulás folytatása</h2>
        <Link href="/dashboard/my-learning">
          <Button variant="outline">Összes megtekintése</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inProgressCourses.map((course: EnrolledCourse, index: number) => (
          <motion.div
            key={course.courseId}
            className={`${cardStyles.flat} overflow-hidden group`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
          >

            {/* Course Thumbnail */}
            <div className="h-48 relative overflow-hidden" style={{ background: brandGradient }}>
              {course.thumbnailUrl ? (
                <img 
                  src={course.thumbnailUrl} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <p className="font-medium">Tartalom</p>
                  </div>
                </div>
              )}
              
              {/* Difficulty Badge */}
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                  {course.difficulty === 'BEGINNER' ? 'Kezdő' : 
                   course.difficulty === 'INTERMEDIATE' ? 'Középhaladó' :
                   course.difficulty === 'ADVANCED' ? 'Haladó' : 'Szakértő'}
                </span>
              </div>
              
              {/* Progress Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">{Math.round(course.completionPercentage)}% teljesítve</span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.estimatedTimeRemaining} hátra
                  </span>
                </div>
                <Progress 
                  value={course.completionPercentage} 
                  className="h-2 bg-white/20"
                />
              </div>
            </div>

            {/* Course Info */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-[#466C95] transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {course.instructorName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {typeof course.category === 'string' ? course.category : (course.category as any)?.name || 'N/A'}
                </p>
              </div>

              {/* Course Progress Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{course.completedLessons}/{course.totalLessons} lecke</span>
                <span>{course.estimatedHours} óra tanulás</span>
              </div>

              {/* Next Lesson */}
              {course.nextLesson && (
                <div className="flex items-center text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Következő: {course.nextLesson.title}
                </div>
              )}

              {/* Continue Button */}
              <Link href={`/courses/${course.slug || course.courseId}/player`} className="block">
                <button className={`w-full ${buttonStyles.primaryLight} !rounded-lg !py-2.5`}>
                  <Play className="w-4 h-4" />
                  <span>Tanulás folytatása</span>
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}