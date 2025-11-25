"use client"
import React from 'react'
import { Sparkles, GraduationCap, Building } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// Define types for API responses
interface StatsResponse {
  success: boolean;
  stats: {
    courseCount: number;
    userCount: number;
    categoryCount: number;
    universityCount: number;
  };
  error?: string;
}
interface InstructorsResponse {
  instructors: { 
    institution: string | null;
    company: string | null;
  }[];
}

export const TopInfoBar: React.FC = () => {
  // Fetch total courses
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<StatsResponse, Error>({
    queryKey: ['topInfoBar-stats'],
    queryFn: async () => {
      try {
        const getStatsFn = httpsCallable(functions, 'getStats')
        const result: any = await getStatsFn({})
        
        if (!result.data.success) {
          throw new Error(result.data.error || 'Hiba a tartalom statisztikák betöltésekor')
        }
        
        return result.data
      } catch (error) {
        console.error('Error fetching stats:', error)
        throw new Error('Hiba a tartalom statisztikák betöltésekor')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Fetch instructors to count unique institutions
  const { data: instData, isLoading: instLoading, error: instError } = useQuery<InstructorsResponse, Error>({
    queryKey: ['topInfoBar-instructors'],
    queryFn: async () => {
      try {
        const getInstructorsPublicFn = httpsCallable(functions, 'getInstructorsPublic')
        const result: any = await getInstructorsPublicFn({ limit: 100 }) // Get more instructors for accurate counts
        
        if (!result.data.success) {
          throw new Error(result.data.error || 'Hiba az oktatók betöltésekor')
        }
        
        // Transform the data to match the expected interface
        const instructors = result.data.instructors.map((instructor: any) => ({
          institution: instructor.company || null,
          company: instructor.company || null,
        }))
        
        return { instructors }
      } catch (error) {
        console.error('Error fetching instructors:', error)
        throw new Error('Hiba az oktatók betöltésekor')
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Loading state
  if (statsLoading || instLoading) {
    return (
      <div className="mx-auto py-2 flex justify-center">
        <div className="animate-pulse bg-white rounded-full shadow-lg h-10 w-full max-w-3xl" />
      </div>
    )
  }
  
  // Error state
  if (statsError || instError) {
    console.error('TopInfoBar API Error:', { statsError, instError })
    return (
      <div className="mx-auto py-2 flex justify-center">
        <div className="bg-red-500 text-white px-4 py-1.5 rounded-full shadow-lg">
          Hiba a statisztikák betöltésekor
        </div>
      </div>
    )
  }
  
  // Extract dynamic values with fallbacks
  const courseCount = stats?.stats?.courseCount || 0
  
  // Calculate separate counts for universities and companies
  const universityCount = instData?.instructors 
    ? Array.from(new Set(instData.instructors
        .map(i => i.institution)
        .filter(Boolean))).length
    : 0
    
  const companyCount = instData?.instructors 
    ? Array.from(new Set(instData.instructors
        .map(i => i.company)
        .filter(Boolean))).length
    : 0

  return (
    <div className="mx-auto py-2 flex justify-center">
      <div className="bg-white rounded-full shadow-lg flex items-center px-6 py-2 space-x-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-gray-800 font-medium">{courseCount.toLocaleString()} Tartalom</span>
          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">Új</span>
        </div>
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-green-500" />
          <span className="text-gray-800 font-medium">{universityCount} Egyetem</span>
          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">Új</span>
        </div>
        <div className="flex items-center space-x-2">
          <Building className="w-5 h-5 text-primary" />
          <span className="text-gray-800 font-medium">{companyCount} Vállalat</span>
          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">Új</span>
        </div>
        <a
          href="#"
          className="ml-2 bg-gradient-to-r from-primary-light to-primary-dark text-white px-4 py-1.5 rounded-full text-sm font-bold hover:opacity-90 transition-all"
        >
          Infó: első 2 modul ingyenesen kipróbálható az összes tartalomnál!
        </a>
      </div>
    </div>
  )
} 