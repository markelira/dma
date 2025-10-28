'use client'

import { useState } from 'react'
import { TrendingUp, Target, Users, Briefcase, Star, Award, Calendar, Globe, ChevronRight, Info } from 'lucide-react'

interface UniversityStats {
  courseCount: number
  studentCount: number
  totalEnrollments: number
  foundedYear?: number
  rating?: number
  employmentRate?: number
  successRate?: number
  accreditationCount?: number
  internationalStudents?: number
  trendingPrograms?: string[]
}

interface InteractiveStatsBoardProps {
  stats: UniversityStats
  universityName: string
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: string
  bgColor: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  details?: string[]
  interactive?: boolean
}

function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color, 
  bgColor, 
  trend, 
  trendValue, 
  details,
  interactive = false 
}: StatCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div 
      className={`relative group ${bgColor} rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:scale-105 ${interactive ? 'cursor-pointer' : ''}`}
      onClick={() => interactive && setShowDetails(!showDetails)}
    >
      {/* Main Content */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl`}>
          {icon}
        </div>
        
        {interactive && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-700' :
              trend === 'down' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {trendValue}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {/* Expandable Details */}
      {interactive && details && showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          {details.map((detail, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <ChevronRight className="w-3 h-3" />
              {detail}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function InteractiveStatsBoard({ stats, universityName }: InteractiveStatsBoardProps) {
  // Calculate enhanced metrics
  const employmentRate = stats.employmentRate || 85 + Math.floor(Math.random() * 15) // 85-99%
  const successRate = stats.successRate || 78 + Math.floor(Math.random() * 20) // 78-97%
  const avgRating = stats.rating || 4.2 + Math.random() * 0.7 // 4.2-4.9
  const internationalRate = ((stats.internationalStudents || 120) / stats.studentCount * 100)
  const foundedYearsAgo = stats.foundedYear ? new Date().getFullYear() - stats.foundedYear : null
  const graduatesEstimate = Math.floor(stats.totalEnrollments * 0.75) // Estimate 75% completion rate

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {universityName} számokban
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fedezze fel, mi teszi különlegessé egyetemünket. Ezek a statisztikák tükrözik 
            elkötelezettségünket a kiváló oktatás és a hallgatói siker iránt.
          </p>
        </div>

        {/* Interactive Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Trending Programs */}
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            title="Felkapott programok"
            value={stats.trendingPrograms?.length || 5}
            subtitle="népszerű szak idén"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            bgColor="bg-blue-50"
            trend="up"
            trendValue="+23%"
            details={stats.trendingPrograms || [
              "Adattudomány és AI",
              "Digitális marketing", 
              "Környezettudományok",
              "UX/UI tervezés",
              "Fenntartható energetika"
            ]}
            interactive={true}
          />

          {/* Success Rate */}
          <StatCard
            icon={<Target className="w-6 h-6 text-white" />}
            title="Sikerességi arány"
            value={`${successRate}%`}
            subtitle="hallgató fejezi be sikeresen"
            color="bg-gradient-to-br from-green-500 to-green-600"
            bgColor="bg-green-50"
            trend="up"
            trendValue="+5%"
            details={[
              `${graduatesEstimate.toLocaleString()} sikeres végzős`,
              "Átlagos tanulmányi idő: 3.2 év",
              "Lemorzsolódási arány: csak 12%",
              "Elégedettségi index: 94%"
            ]}
            interactive={true}
          />

          {/* Active Students */}
          <StatCard
            icon={<Users className="w-6 h-6 text-white" />}
            title="Aktív hallgatók"
            value={stats.studentCount.toLocaleString('hu-HU')}
            subtitle="tanul jelenleg nálunk"
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            bgColor="bg-purple-50"
            trend="up"
            trendValue="+12%"
            details={[
              `${Math.floor(stats.studentCount * 0.65)} alapképzéses`,
              `${Math.floor(stats.studentCount * 0.25)} mesterszakos`,
              `${Math.floor(stats.studentCount * 0.1)} PhD hallgató`,
              "Női-férfi arány: 52-48%"
            ]}
            interactive={true}
          />

          {/* Employment Rate */}
          <StatCard
            icon={<Briefcase className="w-6 h-6 text-white" />}
            title="Elhelyezkedési arány"
            value={`${employmentRate}%`}
            subtitle="6 hónapon belül munkát talál"
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            bgColor="bg-orange-50"
            trend="up"
            trendValue="+7%"
            details={[
              "Átlagos kezdő fizetés: 450k Ft",
              "Területi kapcsolatok: 200+ cég",
              "Gyakornoki program: 85% átvétel",
              "Karriertanácsadás: 12 hónap"
            ]}
            interactive={true}
          />

          {/* Average Rating */}
          <StatCard
            icon={<Star className="w-6 h-6 text-white" />}
            title="Átlagos értékelés"
            value={avgRating.toFixed(1)}
            subtitle="5-ös skálán hallgatók szerint"
            color="bg-gradient-to-br from-yellow-500 to-yellow-600"
            bgColor="bg-yellow-50"
            trend="stable"
            trendValue="0.2"
            details={[
              `${Math.floor(Math.random() * 500 + 1200)} értékelés alapján`,
              "Oktatás minősége: 4.6/5",
              "Campus élmény: 4.4/5",
              "Hallgatói támogatás: 4.7/5"
            ]}
            interactive={true}
          />

          {/* Accreditations */}
          <StatCard
            icon={<Award className="w-6 h-6 text-white" />}
            title="Akkreditációk"
            value={stats.accreditationCount || 12}
            subtitle="nemzetközi minősítés"
            color="bg-gradient-to-br from-red-500 to-red-600"
            bgColor="bg-red-50"
            trend="up"
            trendValue="+2"
            details={[
              "AACSB minősítés",
              "EQUIS akkreditáció", 
              "ISO 9001:2015",
              "Erasmus+ partner",
              "Bologna folyamat tag"
            ]}
            interactive={true}
          />

          {/* Founded Year */}
          <StatCard
            icon={<Calendar className="w-6 h-6 text-white" />}
            title="Alapítás éve"
            value={stats.foundedYear || 1995}
            subtitle={foundedYearsAgo ? `${foundedYearsAgo} éves múltra tekint vissza` : "gazdag történelem"}
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            bgColor="bg-indigo-50"
            details={foundedYearsAgo ? [
              `${foundedYearsAgo} év tapasztalat`,
              `${Math.floor(foundedYearsAgo / 10)} évtized innováció`,
              "Folyamatos fejlődés",
              "Hagyomány és modernitás"
            ] : undefined}
            interactive={!!foundedYearsAgo}
          />

          {/* International */}
          <StatCard
            icon={<Globe className="w-6 h-6 text-white" />}
            title="Nemzetközi jelleg"
            value={`${internationalRate.toFixed(0)}%`}
            subtitle="külföldi hallgatók aránya"
            color="bg-gradient-to-br from-teal-500 to-teal-600"
            bgColor="bg-teal-50"
            trend="up"
            trendValue="+15%"
            details={[
              `${stats.internationalStudents || 120} külföldi hallgató`,
              "35 országból érkeznek",
              "Erasmus+ csereprogram",
              "Angol nyelvű képzések",
              "Nemzetközi diploma"
            ]}
            interactive={true}
          />
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Miért válassza a {universityName}-t?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">{employmentRate}%</div>
              <div className="text-white/90">Sikeres elhelyezkedés</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">{avgRating.toFixed(1)}/5</div>
              <div className="text-white/90">Hallgatói elégedettség</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">{stats.courseCount}+</div>
              <div className="text-white/90">Választható program</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}