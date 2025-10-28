"use client"
import React, { useState, useEffect } from 'react'
import { Container } from '@/components/layout/container'
import { Card } from '@/components/ui/card'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Review {
  id: string
  rating: number
  comment: string
  user: {
    id: string
    name: string
    avatar?: string
    role?: string
    company?: string
  }
  course: {
    id: string
    title: string
  }
  createdAt: string
  isApproved: boolean
}

async function fetchReviews(): Promise<Review[]> {
  try {
    const getAllReviewsFn = httpsCallable(functions, 'getAllReviews')
    const result: any = await getAllReviewsFn({ limit: 10, approved: true })
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a vélemények betöltésekor')
    }
    
    return result.data.reviews || []
  } catch (error) {
    console.error('Error fetching reviews:', error)
    throw new Error('Hiba a vélemények betöltésekor')
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const { data: reviews, isLoading, error } = useQuery<Review[], Error>({
    queryKey: ['testimonials'],
    queryFn: fetchReviews,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Filter approved reviews and sort by rating
  const approvedReviews = React.useMemo(() => {
    if (!reviews) return []
    return reviews
      .filter(review => review.isApproved && review.rating >= 4)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6) // Show top 6 reviews
  }, [reviews])

  // Auto-advance carousel
  useEffect(() => {
    if (approvedReviews.length <= 3) return

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % (approvedReviews.length - 2))
    }, 5000)

    return () => clearInterval(interval)
  }, [approvedReviews.length])

  const nextSlide = () => {
    if (approvedReviews.length <= 3) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % (approvedReviews.length - 2))
  }

  const prevSlide = () => {
    if (approvedReviews.length <= 3) return
    setDirection(-1)
    setCurrentIndex((prev) => 
      prev === 0 ? approvedReviews.length - 3 : prev - 1
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (isLoading) {
    return (
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <Container className="max-w-7xl">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-6 mx-auto max-w-md"></div>
              <div className="h-6 bg-gray-200 rounded mx-auto max-w-2xl"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl p-8 h-64">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-6"></div>
                  <div className="h-8 bg-gray-200 rounded-full w-8 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  if (error) {
    console.error('TestimonialsCarousel API Error:', error)
    return (
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <Container className="max-w-7xl text-center">
          <div className="text-red-500">Hiba a vélemények betöltésekor</div>
        </Container>
      </section>
    )
  }

  if (approvedReviews.length === 0) {
    return null // Hide section if no reviews
  }

  const visibleReviews = approvedReviews.slice(currentIndex, currentIndex + 3)

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <Container className="max-w-7xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Mit mondanak diákjaink?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Valós tapasztalatok és eredmények azoktól, akik már sikeresen befejezték kurzusainkat
          </p>
        </motion.div>

        <div className="relative">
          {/* Navigation buttons */}
          {approvedReviews.length > 3 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow group"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow group"
              >
                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
              </button>
            </>
          )}

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              {visibleReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  variants={cardVariants}
                  initial={{ opacity: 0, x: direction * 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="relative p-8 h-full bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0">
                    {/* Quote icon */}
                    <div className="absolute top-6 right-6">
                      <Quote className="w-8 h-8 text-primary/20" />
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-sm text-gray-500">
                        {review.rating}/5
                      </span>
                    </div>

                    {/* Review text */}
                    <blockquote className="text-gray-700 mb-6 leading-relaxed">
                      "{review.comment}"
                    </blockquote>

                    {/* Course info */}
                    <div className="text-sm text-primary font-medium mb-4">
                      {review.course.title}
                    </div>

                    {/* User info */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {review.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {review.user.name}
                        </div>
                        {review.user.role && (
                          <div className="text-sm text-gray-500">
                            {review.user.role}
                            {review.user.company && ` at ${review.user.company}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Dots indicator */}
          {approvedReviews.length > 3 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: approvedReviews.length - 2 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > currentIndex ? 1 : -1)
                    setCurrentIndex(i)
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
} 