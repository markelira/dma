'use client'

import { UniversityLoadingError } from '@/components/university/UniversityErrorBoundary'

export default function UniversityError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <UniversityLoadingError onRetry={reset} />
}