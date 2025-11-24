import React from 'react'
import { Container } from '@/components/layout/container'
import { useCategories } from '@/hooks/useCategoryQueries'
import Link from 'next/link'
import { useCourseList } from '@/hooks/useCourseQueries'
import { CourseCard } from '@/components/course/CourseCard'
import { useUniversities } from '@/hooks/useUniversityQueries'
import Image from 'next/image'
import { API_BASE_URL } from '@/constants'
import { useJobRoles } from '@/hooks/useJobRoles'
import { JobRoleCard } from '@/components/course/JobRoleCard'

import { FAQItem } from '@/components/course/FAQItem'
import faqs from '@/data/faqs.json'

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="heading-2 text-primary mb-8">{children}</h2>
)

// 1. Explore Categories
export const ExploreCategoriesSectionPlaceholder = () => {
  const { data: categories, isLoading } = useCategories()

  if (isLoading) {
    return (
      <section id="kategoriak-felfedezese" className="py-24 bg-white">
        <Container>
          <Heading>Kategóriák felfedezése</Heading>
          <p className="text-muted mb-6 max-w-2xl">Böngéssz az DMA főbb témakörei között, és találd meg a hozzád illő tartalmat.</p>
          <div className="flex flex-wrap gap-3">
            {['Művészet', 'Üzlet', 'Informatika', 'Adattudomány', 'Egészség', 'Nyelvek', 'Matematika'].map(tag => (
              <span key={tag} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">{tag}</span>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section id="kategoriak-felfedezese" className="py-24 bg-white">
      <Container>
        <Heading>Kategóriák felfedezése</Heading>
        <p className="text-muted mb-6 max-w-2xl">Böngéssz az DMA főbb témakörei között, és találd meg a hozzád illő tartalmat.</p>
        <div className="flex flex-wrap gap-3">
          {categories?.map(category => (
            <Link key={category.id} href={`/courses?category=${category.id}`}>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors">{category.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}

// 2. Career Roles
export const CareersSectionPlaceholder = () => {
  const { data: roles, isLoading } = useJobRoles()

  return (
    <section id="karrierek" className="py-24 bg-gray-50">
      <Container>
        <div className="bg-white shadow rounded-2xl p-8 md:p-12 flex flex-col lg:flex-row gap-8">
          {/* Left intro column */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            <div>
              <h2 className="heading-2 text-primary mb-4">Karrierek</h2>
              <p className="text-muted">Növekedj karrieredben és szerezz új készségeket prémium tartalmainkkal.</p>
            </div>
            <div>
              <button className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition">Az összes megtekintése</button>
            </div>
          </div>

          {/* Right content column */}
          <div className="lg:w-2/3 flex-1">
            {/* Filter chips row (static) */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[ 'Népszerű', 'Szoftverfejlesztés és IT', 'Üzlet', 'Értékesítés és marketing', 'Adattudomány és analitika', 'Egészségügy' ].map(tag => (
                <span key={tag} className="px-4 py-1 rounded-full border text-sm whitespace-nowrap cursor-pointer hover:bg-primary/10">
                  {tag}
                </span>
              ))}
            </div>

            {/* Role cards */}
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {roles?.slice(0,3).map(role => (
                  <JobRoleCard key={role.id} role={role as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}

// 3. Most Popular
export const PopularCoursesSectionPlaceholder = () => {
  const { data, isLoading } = useCourseList({ limit: 4, offset: 0, sort: 'popular', status: 'PUBLISHED' })
  const courses = data?.courses || []

  if (isLoading) {
    return (
      <section id="nepszeru-tartalmak" className="py-24 bg-white">
        <Container>
          <Heading>Legnépszerűbb tartalmak</Heading>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-56 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section id="nepszeru-tartalmak" className="py-24 bg-white">
      <Container>
        <Heading>Legnépszerűbb tartalmak</Heading>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </Container>
    </section>
  )
}

// 4. In-demand Skills
export const InDemandSkillsSectionPlaceholder = () => (
  <section id="keresett-keszsegek" className="py-24 bg-gray-50">
    <Container>
      <Heading>Keresett készségek</Heading>
      <div className="flex flex-wrap gap-3">
        {['Leadership', 'Machine Learning', 'Python', 'Excel', 'Kritikus gondolkodás'].map(skill => (
          <span key={skill} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm">{skill}</span>
        ))}
      </div>
    </Container>
  </section>
)

// 5. Trending Now
export const TrendingCoursesSectionPlaceholder = () => {
  const { data, isLoading } = useCourseList({ limit: 4, offset: 0, sort: 'rating', status: 'PUBLISHED' })
  const courses = data?.courses || []

  return (
    <section id="trending" className="py-24 bg-white">
      <Container>
        <Heading>Népszerű most</Heading>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-56 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

// 6. New Releases
export const NewReleasesSectionPlaceholder = () => {
  const { data, isLoading } = useCourseList({ limit: 2, offset: 0, sort: 'new', status: 'PUBLISHED' })
  const courses = data?.courses || []

  return (
    <section id="uj-megjelenesek" className="py-24 bg-gray-50">
      <Container>
        <Heading>Új megjelenések</Heading>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {[1,2].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

// 8. Partners
export const PartnersSectionPlaceholder = () => {
  const { data: universities, isLoading } = useUniversities()
  const backendBase = API_BASE_URL.replace(/\/?api$/, '')

  return (
    <section id="partnerek" className="py-24 bg-gray-50">
      <Container>
        <Heading>Vezető partnereink</Heading>
        {isLoading ? (
          <div className="flex flex-wrap justify-center gap-10">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="w-32 h-12 bg-gray-200 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10">
            {universities?.map(uni => {
              const logoSrc = uni.logoUrl && !uni.logoUrl.startsWith('http') ? backendBase + uni.logoUrl : uni.logoUrl
              return (
                <div key={uni.id} className="w-32 h-12 relative grayscale hover:grayscale-0 transition-all">
                  {logoSrc ? (
                    <Image src={logoSrc} alt={uni.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 rounded-md">
                      {uni.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </section>
  )
}

export const TestimonialsSectionPlaceholder = () => {
  return (
    <section id="velemenyek" className="py-24 bg-white">
      <Container>
        <Heading>Hallgatói vélemények</Heading>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 'sample1', comment: 'Az ELIRA segítségével rövid idő alatt új készségeket sajátítottam el.', user: { firstName: 'Anna', lastName: 'P.' } },
            { id: 'sample2', comment: 'Kiváló tartalmak és professzionális oktatók!', user: { firstName: 'Béla', lastName: 'K.' } },
            { id: 'sample3', comment: 'A gyakorlati példák segítettek megérteni az anyagot.', user: { firstName: 'Csilla', lastName: 'M.' } }
          ].map(r => (
              <div key={r.id} className="bg-gray-50 p-6 rounded-xl shadow-sm flex flex-col h-full">
              <p className="text-sm mb-4 line-clamp-4">"{r.comment}"</p>
                <div className="mt-auto text-xs text-muted">- {r.user?.firstName ?? 'Ismeretlen'} {r.user?.lastName ?? ''}</div>
              </div>
            ))}
          </div>
      </Container>
    </section>
  )
}

export const FAQSectionPlaceholder = () => (
  <section id="gyik" className="py-24 bg-gray-50">
    <Container className="max-w-3xl mx-auto">
      <Heading>Gyakori kérdések</Heading>
      <div className="mt-8">
        {(faqs as any[]).map((f,i) => (
          <FAQItem key={i} q={f.question} a={f.answer} />
        ))}
      </div>
    </Container>
  </section>
)

export const CourseListSkeletonSections = {
  ExploreCategoriesSectionPlaceholder,
  CareersSectionPlaceholder,
  PopularCoursesSectionPlaceholder,
  InDemandSkillsSectionPlaceholder,
  TrendingCoursesSectionPlaceholder,
  NewReleasesSectionPlaceholder,
  PartnersSectionPlaceholder,
} 