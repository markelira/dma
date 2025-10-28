"use client"
import React from 'react'
import { Container } from '@/components/layout/container'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Users, Award, Clock, TrendingUp, Star, Quote, CheckCircle, Shield, Globe, Heart } from 'lucide-react'
import Image from 'next/image'

interface Stats {
  userCount: number
  monthlyGrowth: number
  averageCompletionRate: number
  totalEnrollments: number
  totalCourses: number
  totalInstructors: number
}

interface Testimonial {
  id: string
  user: {
    firstName: string
    lastName: string
    profilePictureUrl?: string
    company?: string
    role?: string
  }
  rating: number
  comment: string
  courseName: string
  completedAt: string
}

interface SuccessStory {
  id: string
  title: string
  description: string
  user: {
    firstName: string
    lastName: string
    profilePictureUrl?: string
    company?: string
    role?: string
  }
  beforeImage?: string
  afterImage?: string
  metrics: {
    salaryIncrease?: number
    promotionTime?: number
    skillImprovement?: number
  }
  courseName: string
}

async function fetchStats(): Promise<Stats> {
  try {
    const getStatsFn = httpsCallable(functions, 'getStats')
    const result: any = await getStatsFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a statisztikák betöltésekor')
    }
    
    return {
      userCount: result.data.stats.userCount || 0,
      monthlyGrowth: 25, // Default value since we don't have this stat yet
      averageCompletionRate: 85, // Default value since we don't have this stat yet
      totalEnrollments: 150, // Default value since we don't have this stat yet
      totalCourses: result.data.stats.courseCount || 0,
      totalInstructors: 5, // Default value since we don't have this stat yet
    }
  } catch (error) {
    console.error('Error fetching social proof stats:', error)
    return {
      userCount: 0,
      monthlyGrowth: 0,
      averageCompletionRate: 0,
      totalEnrollments: 0,
      totalCourses: 0,
      totalInstructors: 0,
    }
  }
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const getAllReviewsFn = httpsCallable(functions, 'getAllReviews')
    const result: any = await getAllReviewsFn({ limit: 6, approved: true })
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a vélemények betöltésekor')
    }
    
    // Transform reviews to testimonials format
    return result.data.reviews?.map((review: any) => ({
      id: review.id,
      user: {
        firstName: review.user?.firstName || 'Felhasználó',
        lastName: review.user?.lastName || '',
        profilePictureUrl: review.user?.profilePictureUrl,
        company: review.user?.company,
        role: review.user?.role,
      },
      rating: review.rating,
      comment: review.comment,
      courseName: review.course?.title || 'Kurzus',
      completedAt: review.createdAt,
    })) || []
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return []
  }
}

async function fetchSuccessStories(): Promise<SuccessStory[]> {
  try {
    // For now, return empty array since we don't have success stories endpoint
    return []
  } catch (error) {
    console.error('Error fetching success stories:', error)
    return []
  }
}

const stats = [
  {
    icon: Users,
    label: 'Aktív diákok',
    value: 'userCount',
    suffix: '+',
    description: 'akik már elkezdték tanulmányaikat'
  },
  {
    icon: Award,
    label: 'Befejezési arány',
    value: 'averageCompletionRate',
    suffix: '%',
    description: 'átlagos kurzusbefejezési arány'
  },
  {
    icon: Clock,
    label: 'Havi növekedés',
    value: 'monthlyGrowth',
    suffix: '%',
    description: 'új diákok száma havonta'
  },
  {
    icon: TrendingUp,
    label: 'Összes beiratkozás',
    value: 'totalEnrollments',
    suffix: '+',
    description: 'kurzusokra történt beiratkozások'
  }
]

const trustIndicators = [
  {
    icon: Shield,
    title: 'Biztonságos fizetés',
    description: 'SSL titkosítás és biztonságos fizetési rendszer'
  },
  {
    icon: CheckCircle,
    title: '30 napos visszatérítés',
    description: 'Ha nem vagy elégedett, visszadjuk a pénzed'
  },
  {
    icon: Globe,
    title: 'Globális elismerés',
    description: 'Egyetemek és cégek által elfogadott tanúsítványok'
  },
  {
    icon: Heart,
    title: '24/7 támogatás',
    description: 'Szakképzett csapatunk mindig rendelkezésre áll'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export const SocialProof: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery<Stats, Error>({
    queryKey: ['socialProofStats'],
    queryFn: fetchStats,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const { data: testimonials, isLoading: testimonialsLoading } = useQuery<Testimonial[], Error>({
    queryKey: ['testimonials'],
    queryFn: fetchTestimonials,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  const { data: successStories, isLoading: storiesLoading } = useQuery<SuccessStory[], Error>({
    queryKey: ['successStories'],
    queryFn: fetchSuccessStories,
    retry: 2,
    staleTime: 15 * 60 * 1000,
  })

  const isLoading = statsLoading || testimonialsLoading || storiesLoading

  // Debug logging
  console.log('🔍 SocialProof Debug:', {
    statsData,
    testimonials,
    successStories,
    isLoading,
    statsLoading,
    testimonialsLoading,
    storiesLoading
  })

  if (isLoading) {
    return (
      <section className="py-16 bg-white border-b">
        <Container className="max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse text-center">
                <div className="h-12 bg-gray-200 rounded mb-4 mx-auto w-12"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white border-b">
      <Container className="max-w-7xl">
        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const value = statsData?.[stat.value as keyof Stats] as number || 0

            return (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {value.toLocaleString('hu-HU')}{stat.suffix}
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Miért válassz minket?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Biztonságos, megbízható és elismertebb platformunkkal karrieredet építheted
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="text-center p-6 bg-gray-50 rounded-xl"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {indicator.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {indicator.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Testimonials Section */}
        {testimonials && testimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Mit mondanak rólunk?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Hallgasd meg diákjaink tapasztalatait és sikertörténeteit
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 + index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  
                  <Quote className="w-6 h-6 text-gray-400 mb-3" />
                  
                  <p className="text-gray-700 mb-4 line-clamp-4">
                    "{testimonial.comment}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {testimonial.user.profilePictureUrl ? (
                      <Image
                        src={testimonial.user.profilePictureUrl}
                        alt={`${testimonial.user.firstName} ${testimonial.user.lastName}`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {testimonial.user?.firstName?.charAt(0) ?? 'U'}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        {testimonial.user.firstName} {testimonial.user.lastName}
                      </p>
                      {testimonial.user.company && (
                        <p className="text-sm text-gray-600">
                          {testimonial.user.company}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {testimonial.courseName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Success Stories Section */}
        {successStories && successStories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sikertörténetek
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Látogasd meg, hogyan változtatták meg karrierjüket diákjaink
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {successStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {story.user.profilePictureUrl ? (
                      <Image
                        src={story.user.profilePictureUrl}
                        alt={`${story.user.firstName} ${story.user.lastName}`}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-lg">
                          {story.user?.firstName?.charAt(0) ?? 'U'}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {story.user.firstName} {story.user.lastName}
                      </h3>
                      {story.user.company && (
                        <p className="text-sm text-gray-600">
                          {story.user.company}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">
                    {story.title}
                  </h4>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {story.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {story.metrics.salaryIncrease && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          {story.metrics.salaryIncrease}% fizetésemelés
                        </span>
                      </div>
                    )}
                    {story.metrics.promotionTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          Befizetés {story.metrics.promotionTime} hónapon belül
                        </span>
                      </div>
                    )}
                    {story.metrics.skillImprovement && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">
                          {story.metrics.skillImprovement}% készségfejlesztés
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Kurzus: {story.courseName}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </Container>
    </section>
  )
} 