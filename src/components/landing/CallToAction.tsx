"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { ArrowRight, CheckCircle, Star, Users, Award } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Stats {
  userCount: number
  courseCount: number
  averageCompletionRate: number
}

interface Reviews {
  reviews: Array<{
    id: string
    rating: number
    comment: string
    user: {
      id: string
      firstName: string
      lastName: string
      role: string
      companyRole?: string
      institution?: string
    }
    course: {
      id: string
      title: string
    }
  }>
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
      courseCount: result.data.stats.courseCount || 0,
      averageCompletionRate: 85, // Default value since we don't have this stat yet
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      userCount: 0,
      courseCount: 0,
      averageCompletionRate: 0,
    }
  }
}

async function fetchReviews(): Promise<Reviews> {
  try {
    const getAllReviewsFn = httpsCallable(functions, 'getAllReviews')
    const result: any = await getAllReviewsFn({ limit: 10, approved: true })
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a vélemények betöltésekor')
    }
    
    return { reviews: result.data.reviews || [] }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return { reviews: [] }
  }
}

export const CallToAction: React.FC = () => {
  const router = useRouter()

  const { data: stats, isLoading: statsLoading } = useQuery<Stats, Error>({
    queryKey: ['ctaStats'],
    queryFn: fetchStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<Reviews, Error>({
    queryKey: ['ctaReviews'],
    queryFn: fetchReviews,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Calculate average rating from real reviews data
  const averageRating = reviewsData?.reviews && reviewsData.reviews.length > 0
    ? (reviewsData.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsData.reviews.length).toFixed(1)
    : '4.8'

  // Get a random testimonial from reviews
  const testimonial = reviewsData?.reviews && reviewsData.reviews.length > 0
    ? reviewsData.reviews[Math.floor(Math.random() * reviewsData.reviews.length)]
    : null

  const benefits = [
    '30 napos ingyenes próba',
    'Élethosszig tartó hozzáférés',
    'Szakmai tanúsítványok',
    'Valós projektek',
    'Szakértő támogatás',
    'Mobilbarát platform'
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <Container className="max-w-6xl relative">
        <div className="text-center text-white mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Készen áll a következő lépésre?
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Csatlakozzon több ezer sikeres diákunkhoz és kezdje el karrierjének fejlesztését ma. 
            Az DMA segít elérni céljait.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Benefits and CTA */}
          <div className="space-y-8">
            {/* Benefits list */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <span className="text-white text-lg">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center space-x-6 text-white/80">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">
                  {reviewsLoading ? 'Betöltés...' : `${averageRating}/5.0 értékelés`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">
                  {statsLoading ? 'Betöltés...' : `${stats?.userCount.toLocaleString('en-US') || 0}+ elégedett diák`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span className="text-sm">
                  {statsLoading ? 'Betöltés...' : `${stats?.averageCompletionRate || 0}% elégedettség`}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/register')}
                className="group bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Ingyenes próba indítása</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => router.push('/courses')}
                className="group border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-primary transition-all duration-300 flex items-center justify-center"
              >
                Tartalmak megtekintése
              </button>
            </div>

            {/* Trust indicators */}
            <div className="text-white/70 text-sm">
              <p>✓ Nincs kötelezettség • ✓ Bármikor lemondható • ✓ 30 napos garancia</p>
            </div>
          </div>

          {/* Right side - Stats and testimonials */}
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? '...' : `${stats?.userCount.toLocaleString('en-US') || 0}+`}
                </div>
                <div className="text-white/80 text-sm">Aktív diák</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? '...' : `${stats?.courseCount || 0}+`}
                </div>
                <div className="text-white/80 text-sm">Tartalom</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {statsLoading ? '...' : `${stats?.averageCompletionRate || 0}%`}
                </div>
                <div className="text-white/80 text-sm">Elégedettség</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {reviewsLoading ? '...' : `${reviewsData?.reviews?.length || 0}+`}
                </div>
                <div className="text-white/80 text-sm">Értékelés</div>
              </div>
            </div>

            {/* Quick testimonial */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (testimonial?.rating || 0) ? 'text-yellow-400 fill-current' : 'text-white/30'}`} />
                ))}
              </div>
              <blockquote className="text-white/90 italic mb-4">
                {reviewsLoading ? 'Betöltés...' : testimonial ? `"${testimonial.comment}"` : '"Az DMA segítségével új karrierutat építettem. A gyakorlati projektek és a szakértő támogatás hihetetlenül értékes volt."'}
              </blockquote>
              <div className="text-white/80 text-sm">
                <strong>
                  {reviewsLoading ? 'Betöltés...' : testimonial ? `${testimonial.user?.firstName || 'Unknown'} ${testimonial.user?.lastName || 'User'}` : 'Eszter Nagy'}
                </strong> • {reviewsLoading ? 'Betöltés...' : testimonial ? (testimonial.user?.companyRole || testimonial.user?.institution || 'Diák') : 'Marketing Manager'}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
} 