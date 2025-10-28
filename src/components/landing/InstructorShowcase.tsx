"use client"
import React from 'react'
import { Container } from '@/components/layout/container'
import { Card } from '@/components/ui/card'
import { Star, Award, Users, BookOpen, Linkedin, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Instructor {
  id: string
  name: string
  title: string
  bio: string
  avatar?: string
  linkedinUrl?: string
  websiteUrl?: string
  averageRating: number
  reviewCount: number
  studentCount: number
  courseCount: number
  expertise: string[]
  company?: string
  isVerified: boolean
}

async function fetchInstructors(): Promise<Instructor[]> {
  try {
    // Development mode: return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: using mock instructors')
      return [
        {
          id: 'instructor-1',
          name: 'Dr. Nagy Anna',
          title: 'Senior Frontend Fejlesztő',
          bio: 'Több mint 10 éves tapasztalattal rendelkezem a webes technológiákban. React és Vue.js szakértő, több multinacionális cégnél dolgoztam.',
          avatar: null,
          linkedinUrl: 'https://linkedin.com/in/nagyanna',
          websiteUrl: 'https://nagyanna.dev',
          averageRating: 4.8,
          reviewCount: 156,
          studentCount: 2500,
          courseCount: 8,
          expertise: ['React', 'Vue.js', 'TypeScript'],
          company: 'Google',
          isVerified: true
        },
        {
          id: 'instructor-2',
          name: 'Kovács Péter',
          title: 'Full-Stack Developer',
          bio: 'Backend és frontend fejlesztésben egyaránt jártas. Node.js és Python szakértő, startup környezetben szerzett értékes tapasztalatok.',
          avatar: null,
          linkedinUrl: 'https://linkedin.com/in/kovacspeter',
          websiteUrl: null,
          averageRating: 4.6,
          reviewCount: 89,
          studentCount: 1800,
          courseCount: 5,
          expertise: ['Node.js', 'Python', 'MongoDB'],
          company: 'Microsoft',
          isVerified: true
        },
        {
          id: 'instructor-3',
          name: 'Szabó Mária',
          title: 'UI/UX Designer',
          bio: 'Kreatív designeremként felhasználóbarát interfészeket tervezek. Figma és Adobe Creative Suite szakértő, több díjnyertes projektben vettem részt.',
          avatar: null,
          linkedinUrl: 'https://linkedin.com/in/szabomaria',
          websiteUrl: 'https://szabomaria.design',
          averageRating: 4.9,
          reviewCount: 203,
          studentCount: 3200,
          courseCount: 12,
          expertise: ['Figma', 'User Research', 'Prototyping'],
          company: 'Adobe',
          isVerified: true
        }
      ]
    }
    
    // Production mode: call Cloud Function
    const getInstructorsPublicFn = httpsCallable(functions, 'getInstructorsPublic')
    const result: any = await getInstructorsPublicFn({ limit: 6, verified: true })
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba az oktatók betöltésekor')
    }
    
    return result.data.instructors || []
  } catch (error) {
    console.error('Error fetching instructors:', error)
    throw new Error('Hiba az oktatók betöltésekor')
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
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

export const InstructorShowcase: React.FC = () => {
  const { data: instructors, isLoading, error } = useQuery<Instructor[], Error>({
    queryKey: ['instructors'],
    queryFn: fetchInstructors,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

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
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <Container className="max-w-7xl">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-6 mx-auto max-w-md"></div>
              <div className="h-6 bg-gray-200 rounded mx-auto max-w-2xl"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl p-8 h-80">
                  <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  if (error) {
    console.error('InstructorShowcase API Error:', error)
    return (
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <Container className="max-w-7xl text-center">
          <div className="text-red-500">Hiba az oktatók betöltésekor</div>
        </Container>
      </section>
    )
  }

  if (!instructors || instructors.length === 0) {
    return null // Hide section if no instructors
  }

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <Container className="max-w-7xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Szakértő Oktatóink
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tanuljon a legjobbaktól - vállalati vezetőktől, egyetemi professzoroktól és szakértőktől
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {instructors.map((instructor) => (
            <motion.div
              key={instructor.id}
              variants={cardVariants}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="relative p-8 h-full bg-white hover:shadow-2xl transition-all duration-300 transform border-0 group">
                {/* Verification badge */}
                {instructor.isVerified && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Avatar */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {instructor.avatar ? (
                      <img
                        src={instructor.avatar}
                        alt={instructor?.name || 'instructor'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (instructor?.name?.charAt(0)?.toUpperCase() || '?')
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {instructor?.name || 'Névtelen oktató'}
                  </h3>
                  
                  <p className="text-primary font-semibold mb-2">
                    {instructor.title}
                  </p>
                  
                  {instructor.company && (
                    <p className="text-sm text-gray-600 mb-3">
                      {instructor.company}
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(Number(instructor?.averageRating ?? 0))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {Number(instructor?.averageRating ?? 0).toFixed(1)} ({instructor?.reviewCount ?? 0} értékelés)
                  </span>
                </div>

                {/* Bio */}
                <p className="text-gray-600 text-sm leading-relaxed mb-6 text-center">
                  {(() => {
                    const bioText = instructor?.bio ?? ''
                    return bioText.length > 120 ? `${bioText.substring(0, 120)}...` : bioText
                  })()}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-primary mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {Number(instructor?.studentCount ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Diák</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-primary mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {Number(instructor?.courseCount ?? 0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Kurzus</p>
                  </div>
                </div>

                {/* Expertise tags */}
                {instructor.expertise && instructor.expertise.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {instructor.expertise.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                <div className="flex justify-center space-x-3">
                  {instructor.linkedinUrl && (
                    <a
                      href={instructor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {instructor.websiteUrl && (
                    <a
                      href={instructor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Készen áll a tanulásra?
            </h3>
            <p className="text-gray-600 mb-6">
              Csatlakozzon több ezer diákunkhoz és kezdje el karrierjének fejlesztését ma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors">
                Ingyenes próba
              </button>
              <button className="border border-primary text-primary px-8 py-3 rounded-full font-semibold hover:bg-primary hover:text-white transition-colors">
                Kurzusok megtekintése
              </button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
} 