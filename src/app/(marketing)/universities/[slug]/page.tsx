import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UniversityLogo } from '@/components/branding/UniversityLogo'
import { UniversityErrorBoundary, UniversityNotFoundError } from '@/components/university/UniversityErrorBoundary'
import { PremiumHeroSection } from '@/components/university/PremiumHeroSection'
import { InteractiveStatsBoard } from '@/components/university/InteractiveStatsBoard'
import { PremiumCourseShowcase } from '@/components/university/PremiumCourseShowcase'
import { UniversityStorySection } from '@/components/university/UniversityStorySection'
import { Award, Globe, Phone, MapPin, ExternalLink, Users, BookOpen, TrendingUp } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface PublicCourse {
  id: string
  title: string
  slug?: string
  thumbnailUrl?: string | null
  description?: string
  instructor?: {
    firstName: string
    lastName: string
    title?: string
  }
  rating?: number
  enrollmentCount?: number
  duration?: number
  difficulty?: string
  category?: string
}

interface UniversityData {
  id: string
  name: string
  logoUrl?: string | null
  description?: string | null
  website?: string | null
  phone?: string | null
  address?: string | null
  courseCount: number
  studentCount: number
  totalEnrollments: number
  courses: PublicCourse[]
  backgroundImageUrl?: string | null
  videoUrl?: string | null
  foundedYear?: number
  rating?: number
  accreditationCount?: number
  employmentRate?: number
  internationalStudents?: number
  trendingPrograms?: string[]
  successRate?: number
  credentials?: {
    accreditations?: string[]
    partnerships?: string[]
    achievements?: string[]
  }
  contactInfo?: {
    email?: string
    socialMedia?: {
      linkedin?: string
      facebook?: string
      twitter?: string
    }
  }
}

async function fetchUniversity(slug: string): Promise<UniversityData | null> {
  try {
    // Call the getPublicUniversity Cloud Function
    const getPublicUniversityFn = httpsCallable(functions, 'getPublicUniversity')
    const result = await getPublicUniversityFn({ slug })
    
    if (result.data) {
      return result.data as UniversityData
    }
    return null
  } catch (error) {
    console.error('Error fetching university:', error)
    return null
  }
}



export default async function UniversityPublicPage({ params }: { params: { slug: string } }) {
  const data = await fetchUniversity(params.slug)

  if (!data) {
    return <UniversityNotFoundError slug={params.slug} />
  }

  // Use logoUrl directly since it comes from Cloud Function
  const logoUrl = data.logoUrl || undefined

  return (
    <UniversityErrorBoundary>
      <div className="flex flex-col">
        {/* Premium Hero Section */}
        <PremiumHeroSection university={data} />

        {/* Interactive Stats Board */}
        <InteractiveStatsBoard 
          stats={{
            courseCount: data.courseCount,
            studentCount: data.studentCount,
            totalEnrollments: data.totalEnrollments,
            foundedYear: data.foundedYear,
            rating: data.rating,
            employmentRate: data.employmentRate,
            successRate: data.successRate,
            accreditationCount: data.accreditationCount,
            internationalStudents: data.internationalStudents,
            trendingPrograms: data.trendingPrograms
          }}
          universityName={data.name}
        />

        {/* Premium Course Showcase */}
        <PremiumCourseShowcase 
          courses={data.courses}
          universityName={data.name}
        />

        {/* University Story Section */}
        <UniversityStorySection 
          data={{
            universityName: data.name,
            foundedYear: data.foundedYear,
            mission: "Küldetésünk a kiváló oktatás és kutatás biztosítása, valamint a társadalom szolgálata a tudás átadásán és fejlesztésén keresztül.",
            vision: "Víziónk, hogy vezető egyetemként járuljunk hozzá a fenntartható fejlődéshez és az innováció előmozdításához.",
            history: [
              {
                year: data.foundedYear || 1995,
                milestone: "Egyetem alapítása",
                description: "Az egyetem megalapítása a régió oktatási igényeinek kielégítésére."
              },
              {
                year: (data.foundedYear || 1995) + 5,
                milestone: "Első akkreditáció",
                description: "Sikeres akkreditációs eljárás és a minőségi oktatás elismerése."
              },
              {
                year: (data.foundedYear || 1995) + 10,
                milestone: "Nemzetközi partnerségek",
                description: "Erasmus program indítása és nemzetközi együttműködések kiépítése."
              },
              {
                year: (data.foundedYear || 1995) + 15,
                milestone: "Digitális átállás",
                description: "Modern technológiai infrastruktúra kiépítése és online oktatás bevezetése."
              }
            ],
            achievements: [
              {
                title: "Kiváló oktatási minőség",
                description: "Több mint 92% hallgatói elégedettség és magas elhelyezkedési arány.",
                year: 2023,
                icon: "award"
              },
              {
                title: "Kutatási kiválóság",
                description: "Számos nemzetközi publikáció és kutatási projekt megvalósítása.",
                year: 2022,
                icon: "trophy"
              },
              {
                title: "Fennthatósági díj",
                description: "Környezettudatos campus és zöld egyetemi gyakorlatok elismerése.",
                year: 2023,
                icon: "star"
              }
            ],
            faculty: [
              {
                name: "Dr. Nagy Péter",
                title: "Tanszékvezető professzor",
                department: "Informatika",
                expertise: ["Mesterséges intelligencia", "Gépi tanulás", "Adattudomány"],
                awards: ["Magyar Tudományos Akadémia díja", "Kiváló oktató díj"]
              },
              {
                name: "Dr. Szabó Anna",
                title: "Egyetemi docens",
                department: "Közgazdaságtan",
                expertise: ["Digitális marketing", "E-kereskedelem", "Fogyasztói magatartás"],
                awards: ["Legjobb publikáció díja", "Hallgatói választás díja"]
              },
              {
                name: "Dr. Kovács László",
                title: "Professzor emeritus",
                department: "Mérnöki",
                expertise: ["Fenntartható energetika", "Környezetmérnöki", "Megújuló energia"],
                awards: ["Életműdíj", "Nemzetközi elismerés"]
              }
            ],
            successStories: [
              {
                name: "Molnár Júlia",
                graduationYear: 2020,
                program: "Digitális Marketing",
                currentPosition: "Marketing Director",
                company: "TechStartup Kft.",
                quote: "Az egyetemen szerzett tudás és kapcsolatok meghatározóak voltak a karrierem alakulásában. A gyakorlatias oktatás felkészített a valós kihívásokra.",
                achievement: "30% alatt növekedés"
              },
              {
                name: "Kiss Máté",
                graduationYear: 2019,
                program: "Informatika",
                currentPosition: "Senior Developer",
                company: "Microsoft",
                quote: "A kiváló oktatók és a modern infrastruktúra lehetővé tette, hogy a legújabb technológiákat sajátítsam el és sikeresen elhelyezkedjem.",
                achievement: "Nemzetközi karrier"
              },
              {
                name: "Tóth Eszter",
                graduationYear: 2021,
                program: "Környezetmérnöki",
                currentPosition: "Sustainability Manager",
                company: "Green Solutions Zrt.",
                quote: "Az egyetem fennthatóságra való fókusza inspirált arra, hogy a környezetvédelem területén dolgozzak és változást hozzak létre.",
                achievement: "Startup alapító"
              }
            ]
          }}
        />

      {/* University Credentials */}
      {data.credentials && (
        <section className="bg-gray-50 py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Egyetemi hitelesítések és eredmények</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {data.credentials.accreditations && data.credentials.accreditations.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Akreditációk</h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    {data.credentials.accreditations.map((accreditation, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {accreditation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.credentials.partnerships && data.credentials.partnerships.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Partnerek</h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    {data.credentials.partnerships.map((partnership, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {partnership}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.credentials.achievements && data.credentials.achievements.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold text-lg">Eredmények</h3>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    {data.credentials.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Contact Section */}
      <section className="bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">Kapcsolat</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4">Kapcsolati információk</h3>
              <ul className="space-y-3 text-gray-700">
                {data.website && (
                  <li className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    <span>Weboldal: </span>
                    <Link href={data.website} target="_blank" className="text-primary underline break-all">
                      {data.website}
                    </Link>
                  </li>
                )}
                {data.phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>Telefon: {data.phone}</span>
                  </li>
                )}
                {data.address && (
                  <li className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Cím: {data.address}</span>
                  </li>
                )}
                {data.contactInfo?.email && (
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 text-primary">✉</span>
                    <span>Email: {data.contactInfo.email}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Social Media */}
            {data.contactInfo?.socialMedia && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Közösségi média</h3>
                <div className="flex gap-4">
                  {data.contactInfo.socialMedia.linkedin && (
                    <Link 
                      href={data.contactInfo.socialMedia.linkedin} 
                      target="_blank"
                      className="text-primary hover:text-primary/80"
                    >
                      LinkedIn
                    </Link>
                  )}
                  {data.contactInfo.socialMedia.facebook && (
                    <Link 
                      href={data.contactInfo.socialMedia.facebook} 
                      target="_blank"
                      className="text-primary hover:text-primary/80"
                    >
                      Facebook
                    </Link>
                  )}
                  {data.contactInfo.socialMedia.twitter && (
                    <Link 
                      href={data.contactInfo.socialMedia.twitter} 
                      target="_blank"
                      className="text-primary hover:text-primary/80"
                    >
                      Twitter
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        </section>
      </div>
    </UniversityErrorBoundary>
  )
} 