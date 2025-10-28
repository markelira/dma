'use client'

import { createContext, ReactNode } from 'react'

/**
 * CompanySizeProvider context
 * Provides company size context for personalized content
 */
const CompanySizeContext = createContext({})

export function CompanySizeProvider({ children }: { children: ReactNode }) {
  return (
    <CompanySizeContext.Provider value={{}}>
      {children}
    </CompanySizeContext.Provider>
  )
}
