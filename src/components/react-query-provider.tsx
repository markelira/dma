'use client'

import { ReactNode, useState, useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createQueryClient } from "@/lib/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

interface ReactQueryProviderProps {
  children: ReactNode
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [client] = useState(() => createQueryClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
} 