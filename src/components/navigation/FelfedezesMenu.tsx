import React, { useState } from 'react'
import Link from 'next/link'
import { useObjectives } from '@/hooks/useObjectives'
import { useCategories } from '@/hooks/useCategoryQueries'
import { useCourseList } from '@/hooks/useCourseQueries'
import { useUserProgress } from '@/hooks/useUserProgress'
import { ChevronRight, Minus, X, Star, Users, CheckCircle, Globe, BookOpen, TrendingUp, Award, Play, Building2 } from 'lucide-react'

interface FelfedezesMenuProps {
  onClose?: () => void
}

const FelfedezesMenu: React.FC<FelfedezesMenuProps> = ({ onClose }) => {
  const { data: objectives, isLoading: objectivesLoading, error: objectivesError } = useObjectives()
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const categoriesArray = Array.isArray(categories) ? categories : []
  const { data: newData, isLoading: newLoading, error: newError } = useCourseList({ sort: 'new', limit: 6, status: 'PUBLISHED' })
  const newCourses = newData?.courses || []
  const { data: popularData, isLoading: popularLoading, error: popularError } = useCourseList({ sort: 'popular', limit: 5, status: 'PUBLISHED' })
  const popularCourses = popularData?.courses || []
  const { data: progressCourses, isLoading: progressLoading, error: progressError } = useUserProgress()
  const [hoveredSection, setHoveredSection] = useState<string | null>('objectives')

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0f766e] text-white overflow-hidden animate-fadeIn flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20 bg-[#0f766e]/90 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold tracking-wide">DMA</h1>
        </div>
        <button 
          onClick={onClose}
          className="flex items-center space-x-2 text-sm hover:bg-white/15 p-3 rounded-lg transition-all duration-200 hover:scale-105"
        >
          <span className="font-medium">BEZÁRÁS</span>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#0f766e]" />
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Column - Main Categories */}
        <div className="w-2/5 p-8 border-r border-white/20">
          <div className="space-y-3">
            {/* Mi a célja? */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('objectives')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Mi a célja?</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'objectives' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Kategóriák felfedezése */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('categories')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Kategóriák felfedezése</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'categories' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Új tartalmak */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('new')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Új tartalmak</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'new' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Népszerű tartalmak */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('popular')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Népszerű tartalmak</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'popular' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Karrierutak */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('career')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Karrierutak</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'career' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Egyetemek */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('universities')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Egyetemek</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'universities' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Tanúsítványok */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('certificates')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Tanúsítványok</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'certificates' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>

            {/* Folytassa a tanulást */}
            <div className="space-y-1">
              <button
                onMouseEnter={() => setHoveredSection('progress')}
                className="flex items-center justify-between w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.01] hover:bg-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Folytassa a tanulást</span>
                </div>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  {hoveredSection === 'progress' ? (
                    <Minus className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Sub Categories */}
        <div className="w-3/5 p-8 relative">
          <div className="space-y-6 relative z-10 animate-slideIn">
            {hoveredSection === 'objectives' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Star className="w-6 h-6" />
                  <span>Mi a célja?</span>
                </h3>
                <div className="space-y-3">
                  {objectivesLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                      ))
                    : objectivesError
                    ? <div className="text-red-300">Hiba a célok betöltésekor</div>
                    : objectives?.map(obj => (
                        <Link
                          key={obj.slug}
                          href={`/courses?goal=${obj.slug}`}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                        >
                          <span className="font-medium">{obj.title}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                  <Link
                    href="/objectives"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/15 transition-all duration-200 hover:scale-[1.01] group bg-white/5"
                  >
                    <span className="font-bold">Az összes megtekintése</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'categories' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <BookOpen className="w-6 h-6" />
                  <span>Kategóriák felfedezése</span>
                </h3>
                <div className="space-y-3">
                  {categoriesLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                      ))
                    : categoriesError
                    ? <div className="text-red-300">Hiba a kategóriák betöltésekor</div>
                    : categoriesArray.slice(0, 8).map(cat => (
                        <Link
                          key={cat.id}
                          href={`/courses?category=${cat.id}`}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                        >
                          <span className="font-medium">{cat.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                  <Link
                    href="/categories"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/15 transition-all duration-200 hover:scale-[1.01] group bg-white/5"
                  >
                    <span className="font-bold">Az összes megtekintése</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'new' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Play className="w-6 h-6" />
                  <span>Új tartalmak</span>
                </h3>
                <div className="space-y-3">
                  {newLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                      ))
                    : newError
                    ? <div className="text-red-300">Hiba az új tartalmak betöltésekor</div>
                    : newCourses.map((course: any) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.id}`}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                        >
                          <span className="font-medium truncate">{course.title}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                  <Link
                    href="/courses?sort=new"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/15 transition-all duration-200 hover:scale-[1.01] group bg-white/5"
                  >
                    <span className="font-bold">Az összes új tartalom</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'popular' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6" />
                  <span>Népszerű tartalmak</span>
                </h3>
                <div className="space-y-3">
                  {popularLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                      ))
                    : popularError
                    ? <div className="text-red-300">Hiba a népszerű tartalmak betöltésekor</div>
                    : popularCourses.map((course: any) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.id}`}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                        >
                          <span className="font-medium truncate">{course.title}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                  <Link
                    href="/courses?sort=popular"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/15 transition-all duration-200 hover:scale-[1.01] group bg-white/5"
                  >
                    <span className="font-bold">Az összes népszerű tartalom</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'career' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Users className="w-6 h-6" />
                  <span>Karrierutak</span>
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/career-paths"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <span className="font-medium">Karrierutak áttekintése</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'universities' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Building2 className="w-6 h-6" />
                  <span>Egyetemek</span>
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/universities"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <span className="font-medium">Partner egyetemek</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <Link
                    href="/universities"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <span className="font-medium">Egyetemi tartalmak</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <Link
                    href="/universities"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <span className="font-medium">Felsőoktatási intézmények</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'certificates' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <Award className="w-6 h-6" />
                  <span>Tanúsítványok</span>
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/certificates"
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                  >
                    <span className="font-medium">Tanúsítványok áttekintése</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            )}

            {hoveredSection === 'progress' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6" />
                  <span>Folytassa a tanulást</span>
                </h3>
                <div className="space-y-3">
                  {progressLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                      ))
                    : progressError
                    ? <div className="text-red-300">Hiba a tanulás folytatásának betöltésekor</div>
                    : progressCourses && progressCourses.length > 0
                    ? progressCourses.slice(0, 4).map((course: any) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.id}`}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                        >
                          <span className="font-medium truncate">{course.title}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))
                    : (
                        <Link
                          href="/courses"
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] group"
                        >
                          <span className="font-medium">Böngésszen tartalmak között</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/20 p-4 bg-[#0f766e]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <Link href="/leendo-hallgatoknak" className="hover:text-primary-300 transition-colors hover:scale-105">
              Leendő hallgatóknak
            </Link>
            <Link href="/hallgatoknak" className="hover:text-primary-300 transition-colors hover:scale-105">
              Hallgatóknak
            </Link>
            <Link href="/vallalati-partnereknek" className="hover:text-primary-300 transition-colors hover:scale-105">
              Vállalati partnereknek
            </Link>
            <Link href="/munkatarsaknak" className="hover:text-primary-300 transition-colors hover:scale-105">
              Munkatársaknak
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="https://facebook.com" className="hover:text-primary-300 transition-colors hover:scale-105">
              <span className="text-lg font-bold">f</span>
            </Link>
            <Link href="https://linkedin.com" className="hover:text-primary-300 transition-colors hover:scale-105">
              <span className="text-lg font-bold">in</span>
            </Link>
            <Link href="https://youtube.com" className="hover:text-primary-300 transition-colors hover:scale-105">
              <span className="text-lg">▶</span>
            </Link>
            <Link href="https://instagram.com" className="hover:text-primary-300 transition-colors hover:scale-105">
              <span className="text-lg">📷</span>
            </Link>
            <Link href="https://x.com" className="hover:text-primary-300 transition-colors hover:scale-105">
              <span className="text-lg font-bold">X</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fadeOut {
          animation: fadeOut 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
        .animate-slideOut {
          animation: slideOut 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}

export default FelfedezesMenu 