"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { Users, Award } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

interface Stats {
  userCount: number
  monthlyGrowth: number
  averageCompletionRate: number
}

interface University {
  id: string
  name: string
  logoUrl?: string
  slug: string
}

// MOCK DATA VERSION - No Firebase Functions needed
async function fetchStats(): Promise<Stats> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data instead of calling Firebase Functions
    return {
      userCount: 15420,
      monthlyGrowth: 25,
      averageCompletionRate: 85,
    }
  } catch (error) {
    console.error('Error fetching hero stats:', error)
    return {
      userCount: 15420,
      monthlyGrowth: 25,
      averageCompletionRate: 85,
    }
  }
}

// MOCK DATA VERSION - No Firebase Functions needed
async function fetchUniversities(): Promise<University[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock universities data
    return [
      {
        id: 'bme',
        name: 'BME',
        logoUrl: '',
        slug: 'bme'
      },
      {
        id: 'elte',
        name: 'ELTE',
        logoUrl: '',
        slug: 'elte'
      },
      {
        id: 'corvinus',
        name: 'Corvinus',
        logoUrl: '',
        slug: 'corvinus'
      },
      {
        id: 'szte',
        name: 'SZTE',
        logoUrl: '',
        slug: 'szte'
      },
      {
        id: 'debrecen',
        name: 'DE',
        logoUrl: '',
        slug: 'debrecen'
      },
      {
        id: 'pecs',
        name: 'PTE',
        logoUrl: '',
        slug: 'pecs'
      }
    ]
  } catch (error) {
    console.error('Error fetching universities:', error)
    return []
  }
}

export const HeroSection: React.FC = () => {
  const router = useRouter()

  const { data: stats, isLoading: statsLoading } = useQuery<Stats, Error>({
    queryKey: ['heroStats'],
    queryFn: fetchStats,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  const { data: universities, isLoading: universitiesLoading } = useQuery<University[], Error>({
    queryKey: ['heroUniversities'],
    queryFn: fetchUniversities,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  })

  // Loading states
  const isLoading = statsLoading || universitiesLoading

  // Debug logging
  console.log('🔍 HeroSection Debug:', {
    stats,
    universities,
    isLoading,
    statsLoading,
    universitiesLoading
  })

  return (
    <section className="relative bg-gradient-to-b from-[#f8f9fa] to-[#e0f2f1] dark:from-gray-900 dark:to-gray-800 overflow-hidden transition-colors">
      {/* Subtle background shapes like in the screenshot */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/30 dark:bg-teal-900/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-20 w-64 h-64 bg-teal-100/20 dark:bg-teal-900/10 rounded-full blur-2xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-center">
          {/* Left Column: Copy & CTAs */}
          <motion.div 
            className="flex flex-col justify-center h-full space-y-8"
            initial={{ opacity: 0, x: -50 

            }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Brand Badge */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                <span className="text-gray-900 dark:text-white text-lg font-bold tracking-wider">DMA</span>
                <span className="text-gray-900 dark:text-white bg-teal-100 dark:bg-teal-900 text-xs font-semibold px-2 py-1 rounded-full">PLUS</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  A következő{' '}
                  <span className="bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                    áttörés
                  </span>{' '}
                  már holnap kezdődhet
                </h1>
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-lg leading-relaxed">
                  Gyakorlati készségek vállalat vezetőktől, egyetemi professzoroktól és szakértőktől. 
                  Valós projektekkel, azonnali eredményekkel.
                </p>
              </div>
              
              {/* Enhanced Value Proposition */}
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full"></div>
                  <span className="text-sm md:text-base">Karrier és vállalkozásfejlesztés valós projektekkel</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full"></div>
                  <span className="text-sm md:text-base">Szakértő előadók</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full"></div>
                  <span className="text-sm md:text-base">Elismert tanúsítványok és diplomák</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              className="flex items-center space-x-4 sm:space-x-6 text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">
                  {isLoading ? (
                    <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-16"></span>
                  ) : (
                    `${stats?.userCount.toLocaleString('en-US') || 0}+ diák`
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">
                  {isLoading ? (
                    <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-16"></span>
                  ) : (
                    `${stats?.averageCompletionRate || 0}% befejezés`
                  )}
                </span>
              </div>
            </motion.div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-xl mt-6">
              <Button
                size="default"
                className="flex-1 font-semibold text-base sm:text-lg"
                onClick={() => router.push('/register')}
              >
                Próbálja ki ingyen most
              </Button>
              <Button
                size="default"
                className="flex-1 font-semibold text-base sm:text-lg bg-white/80 dark:bg-gray-800/80 text-primary dark:text-teal-400 border border-primary dark:border-teal-400 hover:bg-white dark:hover:bg-gray-700"
                onClick={() => router.push('/courses')}
              >
                Fedezze fel a kurzusokat
              </Button>
            </div>
          </motion.div>

          {/* Right Column: Visual & Logos */}
          <motion.div 
            className="space-y-6 sm:space-y-8 order-first lg:order-last"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <div className="relative">
              <motion.div 
                className="w-full overflow-hidden rounded-2xl shadow-2xl h-56 lg:h-[300px]"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src="/images/dmahero.png"
                  alt="DMA Learning Platform"
                  width={600}
                  height={300}
                  className="w-full h-full object-cover"
                  priority
                />
              </motion.div>
            </div>

            {/* University Partnerships */}
            {universities && universities.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm"
              >
                <div className="text-center mb-4">
                  <h3 className="text-gray-900 font-semibold mb-2">Egyetemi partnereink</h3>
                  <p className="text-gray-600 text-sm">Elismert intézmények által készített kurzusok</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {universities.slice(0, 6).map((university, index) => (
                    <motion.div
                      key={university.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 1.8 + index * 0.1 }}
                      className="flex items-center justify-center p-3 bg-white/60 rounded-lg shadow-sm"
                    >
                      {university.logoUrl ? (
                        <Image
                          src={university.logoUrl.startsWith('http') ? university.logoUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${university.logoUrl}`}
                          alt={university.name}
                          width={60}
                          height={40}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                          <span className="text-teal-700 text-lg font-bold">
                            {university.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm"
              >
                <div className="text-center">
                  <h3 className="text-gray-900 font-semibold mb-2">Egyetemi partnereink</h3>
                  <p className="text-gray-600 text-sm">Elismert intézmények által támogatott kurzusok</p>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-center p-3 bg-white/60 rounded-lg shadow-sm">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                          <span className="text-teal-700 text-lg font-bold">P{i}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
