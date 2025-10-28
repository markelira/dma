'use client'

export function UniversityCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card animate-pulse">
      {/* Header skeleton */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="p-6 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>

      {/* Statistics skeleton */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="w-4 h-4 bg-gray-200 rounded mx-auto mb-1"></div>
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    </div>
  )
}

export function UniversitiesListSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <section className="bg-gray-200 animate-pulse py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <div className="h-12 bg-gray-300 rounded w-3/4 mx-auto mb-6"></div>
            <div className="h-6 bg-gray-300 rounded w-2/3 mx-auto mb-8"></div>
            <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </section>

      {/* Statistics skeleton */}
      <section className="py-12 bg-white border-b border-gray-200 animate-pulse">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Universities grid skeleton */}
      <section className="py-16 animate-pulse">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <UniversityCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}