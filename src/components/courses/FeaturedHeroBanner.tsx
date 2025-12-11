'use client'

import { motion } from 'motion/react'
import { Play, Video, BookOpen, GraduationCap, Mic } from 'lucide-react'
import Link from 'next/link'

interface FeaturedHeroBannerProps {
  course: {
    id: string
    title: string
    description?: string
    thumbnailUrl?: string
  }
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
  showBadge?: boolean
  ctaText?: string
}

const TYPE_CONFIG = {
  WEBINAR: {
    icon: Video,
    label: 'Webinár',
    color: 'purple-500',
    bgColor: 'bg-purple-500',
    gradient: 'from-purple-900 to-purple-950',
  },
  ACADEMIA: {
    icon: BookOpen,
    label: 'Akadémia',
    color: 'blue-500',
    bgColor: 'bg-blue-500',
    gradient: 'from-blue-900 to-blue-950',
  },
  MASTERCLASS: {
    icon: GraduationCap,
    label: 'Masterclass',
    color: 'amber-500',
    bgColor: 'bg-amber-500',
    gradient: 'from-amber-900 to-amber-950',
  },
  PODCAST: {
    icon: Mic,
    label: 'Podcast',
    color: 'green-500',
    bgColor: 'bg-green-500',
    gradient: 'from-green-900 to-green-950',
  },
}

export function FeaturedHeroBanner({
  course,
  courseType,
  showBadge = true,
  ctaText = 'Megtekintés'
}: FeaturedHeroBannerProps) {
  const config = courseType ? TYPE_CONFIG[courseType] : null
  const Icon = config?.icon

  return (
    <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[350px] max-h-[700px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${config?.gradient || 'from-gray-900 to-gray-950'}`} />
        )}

        {/* Gradient Overlays for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(3,7,18,1)_0%,rgba(3,7,18,0.95)_20%,rgba(3,7,18,0.7)_50%,rgba(3,7,18,0.3)_70%,transparent_85%)]" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 pb-12 md:pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            {/* Type Badge */}
            {showBadge && config && Icon && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor} mb-4`}>
                <Icon className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{config.label}</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {course.title}
            </h1>

            {/* Description */}
            {course.description && (
              <p className="text-gray-300 text-lg mb-6 line-clamp-3 leading-relaxed">
                {course.description}
              </p>
            )}

            {/* CTA Button */}
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Play className="w-5 h-5" />
              {ctaText}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
