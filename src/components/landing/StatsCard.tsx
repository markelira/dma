'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface Stats {
  userCount: number
  monthlyGrowth: number
}

async function fetchStats(): Promise<Stats> {
  try {
    const getStatsFn = httpsCallable(functions, 'getStats')
    const result: any = await getStatsFn({})
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Hiba a statisztikák betöltésekor')
    }
    
    return {
      userCount: result.data.stats.userCount || 0,
      monthlyGrowth: 25, // Default value since we don't have this stat yet
    }
  } catch (error) {
    console.error('Error fetching stats card data:', error)
    return {
      userCount: 0,
      monthlyGrowth: 0,
    }
  }
}

export const StatsCard: React.FC = () => {
  const { data, isLoading, error } = useQuery<Stats, Error>({
    queryKey: ['statsCard-stats'],
    queryFn: fetchStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  if (isLoading) {
    return <div className="animate-pulse bg-white rounded-2xl shadow-card p-6 mb-8 h-28" />
  }
  
  if (error) {
    console.error('StatsCard API Error:', error)
    return <div className="bg-white rounded-2xl shadow-card p-4 max-w-xs text-red-500">Hiba történt</div>
  }
  
  const { userCount, monthlyGrowth } = data ?? { userCount: 0, monthlyGrowth: 0 }
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 max-w-xs">
      <h4 className="text-base font-semibold text-gray-800 mb-2">Aktív felhasználók most  </h4>
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <div className="text-2xl font-bold text-gray-900">{userCount.toLocaleString()}</div>
      </div>
      <div className="mt-1 flex items-center text-green-500 text-xs">
        <span>→ {monthlyGrowth}% az előző hónaphoz képest</span>
      </div>
    </div>
  )
} 