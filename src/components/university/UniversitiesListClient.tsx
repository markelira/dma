'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, GraduationCap, Users, BookOpen, Building2, X } from 'lucide-react'

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

interface UniversitiesListClientProps {
  initialUniversities: University[]
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
                onClick={(e) => e.stopPropagation()}
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
            <div className="text-xs text-gray-500">Kurzus</div>
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

export function UniversitiesListClient({ initialUniversities }: UniversitiesListClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'courseCount' | 'studentCount'>('name')
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSortedUniversities = useMemo(() => {
    let filtered = initialUniversities

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(uni => 
        uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort universities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'courseCount':
          return b.courseCount - a.courseCount
        case 'studentCount':
          return b.studentCount - a.studentCount
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'hu')
      }
    })

    return filtered
  }, [initialUniversities, searchTerm, sortBy])

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('name')
  }

  const hasActiveFilters = searchTerm || sortBy !== 'name'

  return (
    <div className="space-y-8">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Keresés egyetemek között..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Szűrők
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              Törlés
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rendezés
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="name">Név szerint (A-Z)</option>
                  <option value="courseCount">Kurzusok száma</option>
                  <option value="studentCount">Hallgatók száma</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {searchTerm ? `Keresési eredmények` : 'Partner Egyetemeink'}
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedUniversities.length} egyetem
            {searchTerm && ` "${searchTerm}" keresésre`}
          </p>
        </div>
      </div>

      {/* Universities Grid */}
      {filteredAndSortedUniversities.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm ? 'Nincs találat' : 'Nincsenek elérhető egyetemek'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `Nem találtunk egyetemeket a "${searchTerm}" keresésre. Próbáljon más keresőszavakat.`
              : 'Jelenleg nincsenek elérhető partner egyetemek. Kérjük, látogasson vissza később.'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-primary hover:text-primary-dark font-medium"
            >
              Összes egyetem megtekintése
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedUniversities.map((university) => (
            <UniversityCard key={university.id} university={university} />
          ))}
        </div>
      )}
    </div>
  )
}