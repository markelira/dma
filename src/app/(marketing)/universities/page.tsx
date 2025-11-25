import { Suspense } from 'react'
import { UniversitiesListClient } from '@/components/university/UniversitiesListClient'
import { UniversitiesListSkeleton } from '@/components/university/UniversitiesListSkeleton'
import { API_BASE_URL } from '@/constants'
import { Search, GraduationCap, Users, BookOpen, Building2 } from 'lucide-react'

interface University {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  description?: string | null
  website?: string | null
  courseCount: number
  studentCount: number
  totalEnrollments: number
  address?: string | null
}

async function fetchUniversities(): Promise<University[]> {
  try {
    // In a real implementation, this would call a Cloud Function
    // For now, we'll return mock data since we need to implement the backend endpoint
    return [
      {
        id: 'elte',
        name: 'Eötvös Loránd Tudományegyetem',
        slug: 'elte',
        description: 'Magyarország egyik legrangosabb egyeteme, gazdag történelemmel és kiváló oktatási színvonallal.',
        website: 'https://www.elte.hu',
        courseCount: 45,
        studentCount: 1250,
        totalEnrollments: 2100,
        address: 'Budapest, Magyarország'
      },
      {
        id: 'bme',
        name: 'Budapesti Műszaki és Gazdaságtudományi Egyetem',
        slug: 'bme',
        description: 'Magyarország vezető műszaki egyeteme, nemzetközi elismertséggel rendelkezik.',
        website: 'https://www.bme.hu',
        courseCount: 38,
        studentCount: 980,
        totalEnrollments: 1650,
        address: 'Budapest, Magyarország'  
      },
      {
        id: 'corvinus',
        name: 'Budapesti Corvinus Egyetem',
        slug: 'corvinus',
        description: 'Gazdasági és társadalomtudományi képzésekre specializálódott egyetem.',
        website: 'https://www.uni-corvinus.hu',
        courseCount: 28,
        studentCount: 720,
        totalEnrollments: 1200,
        address: 'Budapest, Magyarország'
      },
      {
        id: 'szte',
        name: 'Szegedi Tudományegyetem',
        slug: 'szte',
        description: 'Dél-Magyarország legnagyobb és legjelentősebb felsőoktatási intézménye.',
        website: 'https://www.u-szeged.hu',
        courseCount: 32,
        studentCount: 890,
        totalEnrollments: 1450,
        address: 'Szeged, Magyarország'
      }
    ]
  } catch (error) {
    console.error('Failed to fetch universities:', error)
    return []
  }
}

function UniversityCard({ university }: { university: University }) {
  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      {/* Header with Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          {/* University Logo Placeholder */}
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {university.name.charAt(0)}
            </span>
          </div>
          
          {/* University Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
              {university.name}
            </h3>
            {university.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {university.address}
              </p>
            )}
            {university.website && (
              <a 
                href={university.website}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-xs text-primary hover:text-primary-dark mt-1 inline-block"
              >
                Hivatalos weboldal ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {university.description && (
        <div className="p-6 border-b border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-3">
            {university.description}
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {university.courseCount}
            </div>
            <div className="text-xs text-gray-500">Tartalom</div>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {university.studentCount.toLocaleString('hu-HU')}
            </div>
            <div className="text-xs text-gray-500">Hallgató</div>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {university.totalEnrollments.toLocaleString('hu-HU')}
            </div>
            <div className="text-xs text-gray-500">Beiratkozás</div>
          </div>
        </div>

        {/* View Button */}
        <div className="mt-6">
          <a
            href={`/universities/${university.slug}`}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium text-center block"
          >
            Egyetem megtekintése
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function UniversitiesPage() {
  const universities = await fetchUniversities()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-hero-gradient text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Magyar Egyetemek
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Fedezze fel Magyarország vezető felsőoktatási intézményeit és tartalmaikat
            </p>
            <div className="flex items-center justify-center text-lg font-medium">
              <Building2 className="w-5 h-5 mr-2" />
              {universities.length} partner egyetem
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                {universities.length}
              </div>
              <div className="text-gray-600 font-medium">Partner Egyetem</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                {universities.reduce((sum, uni) => sum + uni.courseCount, 0)}
              </div>
              <div className="text-gray-600 font-medium">Elérhető Tartalom</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                {universities.reduce((sum, uni) => sum + uni.studentCount, 0).toLocaleString('hu-HU')}
              </div>
              <div className="text-gray-600 font-medium">Aktív Hallgató</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">
                {universities.reduce((sum, uni) => sum + uni.totalEnrollments, 0).toLocaleString('hu-HU')}
              </div>
              <div className="text-gray-600 font-medium">Összes Beiratkozás</div>
            </div>
          </div>
        </div>
      </section>

      {/* Universities Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Partner Egyetemeink
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Válasszon a magyar felsőoktatás legkiválóbb intézményei közül és kezdje el tanulmányait már ma.
            </p>
          </div>

          {universities.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nincsenek elérhető egyetemek
              </h3>
              <p className="text-gray-600">
                Jelenleg nincsenek elérhető partner egyetemek. Kérjük, látogasson vissza később.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {universities.map((university) => (
                <UniversityCard key={university.id} university={university} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Készen áll a tanulásra?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Csatlakozzon több ezer hallgatóhoz, akik már megkezdték útjukat a sikeres karrier felé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/courses"
              className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Tartalmak böngészése
            </a>
            <a
              href="/register"
              className="bg-primary-dark text-white px-8 py-3 rounded-lg font-bold hover:bg-primary transition-colors border border-white/20"
            >
              Regisztráció
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}