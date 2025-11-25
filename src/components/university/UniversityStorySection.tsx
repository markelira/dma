'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Calendar, Award, Users, Trophy, Quote, ChevronRight, Star, Briefcase, GraduationCap, Heart } from 'lucide-react'

interface UniversityStoryData {
  universityName: string
  foundedYear?: number
  mission?: string
  vision?: string
  history?: {
    year: number
    milestone: string
    description: string
  }[]
  achievements?: {
    title: string
    description: string
    year?: number
    icon?: string
  }[]
  faculty?: {
    name: string
    title: string
    department: string
    imageUrl?: string
    expertise: string[]
    awards?: string[]
  }[]
  successStories?: {
    name: string
    graduationYear: number
    program: string
    currentPosition: string
    company: string
    imageUrl?: string
    quote: string
    achievement?: string
  }[]
}

interface UniversityStorySectionProps {
  data: UniversityStoryData
}

function TimelineItem({ item, index }: { item: { year: number; milestone: string; description: string }, index: number }) {
  return (
    <div className="relative flex items-start gap-6 pb-8">
      {/* Timeline line */}
      <div className="absolute left-6 top-12 w-0.5 h-full bg-gradient-to-b from-primary to-primary/30" />
      
      {/* Timeline dot */}
      <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold shadow-lg">
        {item.year.toString().slice(-2)}
      </div>
      
      {/* Content */}
      <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-primary font-bold">{item.year}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.milestone}</h3>
        <p className="text-gray-600 leading-relaxed">{item.description}</p>
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: { title: string; description: string; year?: number; icon?: string } }) {
  const iconElement = achievement.icon === 'trophy' ? <Trophy className="w-6 h-6" /> :
                     achievement.icon === 'award' ? <Award className="w-6 h-6" /> :
                     achievement.icon === 'star' ? <Star className="w-6 h-6" /> :
                     <Award className="w-6 h-6" />

  return (
    <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white group-hover:scale-110 transition-transform">
          {iconElement}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
              {achievement.title}
            </h3>
            {achievement.year && (
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {achievement.year}
              </span>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
        </div>
      </div>
    </div>
  )
}

function FacultyCard({ faculty }: { faculty: { name: string; title: string; department: string; imageUrl?: string; expertise: string[]; awards?: string[] } }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
      {/* Faculty Image */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/40">
        {faculty.imageUrl ? (
          <Image
            src={faculty.imageUrl}
            alt={faculty.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Users className="w-16 h-16 text-primary/60" />
          </div>
        )}
        
        {/* Department Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
            {faculty.department}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
            {faculty.name}
          </h3>
          <p className="text-primary font-medium">{faculty.title}</p>
        </div>

        {/* Expertise */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">Szakterületek:</h4>
          <div className="flex flex-wrap gap-2">
            {faculty.expertise.map((skill, index) => (
              <span
                key={index}
                className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Awards */}
        {faculty.awards && faculty.awards.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Award className="w-4 h-4" />
              Díjak:
            </h4>
            <ul className="space-y-1">
              {faculty.awards.slice(0, 2).map((award, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  {award}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessStoryCard({ story }: { story: { name: string; graduationYear: number; program: string; currentPosition: string; company: string; imageUrl?: string; quote: string; achievement?: string } }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="flex items-start gap-4">
          {/* Profile Image */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
            {story.imageUrl ? (
              <Image
                src={story.imageUrl}
                alt={story.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white/80" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{story.name}</h3>
            <p className="text-white/90 font-medium">{story.currentPosition}</p>
            <p className="text-white/70 text-sm">{story.company}</p>
            <p className="text-white/60 text-sm mt-1">
              {story.program} • {story.graduationYear}
            </p>
          </div>
        </div>

        {/* Achievement Badge */}
        {story.achievement && (
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {story.achievement}
            </div>
          </div>
        )}
      </div>

      {/* Quote */}
      <div className="p-6">
        <div className="relative">
          <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
          <blockquote className="text-gray-700 italic leading-relaxed pl-6">
            "{story.quote}"
          </blockquote>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <Briefcase className="w-4 h-4" />
            <span className="font-medium">Sikeres karrierváltás</span>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <Heart className="w-4 h-4" />
            <span className="font-medium">Büszke alumni</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UniversityStorySection({ data }: UniversityStorySectionProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'achievements' | 'faculty' | 'success'>('history')

  const tabs = [
    { key: 'history', label: 'Történet & Küldetés', icon: Calendar },
    { key: 'achievements', label: 'Eredmények', icon: Trophy },
    { key: 'faculty', label: 'Oktatók', icon: Users },
    { key: 'success', label: 'Sikertörténetek', icon: Star }
  ]

  return (
    <section className="py-16 bg-gradient-to-br from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            A {data.universityName} története
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ismerje meg egyetemünk gazdag múltját, büszkeségeinket és azt, 
            ami különlegessé tesz minket a felsőoktatásban.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* History & Mission */}
          {activeTab === 'history' && (
            <div className="space-y-12">
              {/* Mission & Vision */}
              <div className="grid lg:grid-cols-2 gap-8">
                {data.mission && (
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Küldetésünk</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{data.mission}</p>
                  </div>
                )}

                {data.vision && (
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Star className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Víziónk</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{data.vision}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {data.history && data.history.length > 0 && (
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Fontosabb mérföldkövek
                  </h3>
                  <div className="max-w-4xl mx-auto">
                    {data.history.map((item, index) => (
                      <TimelineItem key={index} item={item} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements */}
          {activeTab === 'achievements' && data.achievements && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.achievements.map((achievement, index) => (
                <AchievementCard key={index} achievement={achievement} />
              ))}
            </div>
          )}

          {/* Faculty */}
          {activeTab === 'faculty' && data.faculty && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.faculty.map((faculty, index) => (
                <FacultyCard key={index} faculty={faculty} />
              ))}
            </div>
          )}

          {/* Success Stories */}
          {activeTab === 'success' && data.successStories && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.successStories.map((story, index) => (
                <SuccessStoryCard key={index} story={story} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}