'use client'

import { ReactNode, useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createQueryClient } from "@/lib/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

interface ReactQueryProviderProps {
  children: ReactNode
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create QueryClient once on mount - React Query handles SSR/hydration internally
  const [client] = useState(() => createQueryClient())

  // FIXED: Removed the mounted check that was blocking the entire app
  // React Query v5 handles hydration properly without this pattern
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
} 