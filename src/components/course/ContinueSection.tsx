import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Clock } from 'lucide-react'

import { useInProgressCourses } from '@/hooks/useInProgressCourses'
import { useAuthStore } from '@/stores/authStore'

export const ContinueSection: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const { data: progressData, isLoading, refetch } = useInProgressCourses()

  // Fetch data when component mounts and user is authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      refetch()
    }
  }, [isAuthenticated, refetch])

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <section className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Folytasd a tanulást</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const inProgressCourses = progressData?.enrolledCourses || []

  if (inProgressCourses.length === 0) {
    return null
  }

  // Internal card component for cleaner code and animation handling
  const ContinueCourseCard: React.FC<{ course: any }> = ({ course }) => {

  return (
            <Link
              href={`/courses/${course.courseId}/learn`}
        className="continue-card relative bg-white rounded-lg shadow-sm p-4 group transform-gpu transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl hover:scale-[1.03]"
            >
              <div className="relative h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
              <span>
                {course.completedLessons}/{course.totalLessons} lecke
                  </span>
            </div>
                </div>
              </div>
            </Link>
    )
  }

  return (
    <section className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Folytasd a tanulást</h2>
          <Link
            href="/dashboard"
            className="text-primary hover:text-primary-dark font-medium text-sm"
          >
            Összes kurzus megtekintése →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inProgressCourses.slice(0, 3).map((course) => (
            <ContinueCourseCard key={course.courseId} course={course} />
          ))}
        </div>

        {inProgressCourses.length > 3 && (
          <div className="text-center mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              További {inProgressCourses.length - 3} kurzus megtekintése
            </Link>
          </div>
        )}
      </div>
      {/* Extra perspective & 3D hover effect */}
      <style jsx>{`
        .continue-card {
          perspective: 1000px;
          /* ensure hardware acceleration */
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .continue-card:hover {
          transform: translateY(-12px) scale(1.05) rotateX(3deg) rotateY(-3deg);
        }
      `}</style>
    </section>
  )
} 