'use client'

import { ReactNode } from 'react'

/**
 * DynamicContent component
 * Conditionally renders content based on company size selection
 */
export function DynamicContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
