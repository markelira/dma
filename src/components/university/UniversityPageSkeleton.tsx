'use client'

export function UniversityHeroSkeleton() {
  return (
    <section className="relative bg-gray-200 animate-pulse py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8 min-h-[180px]">
        {/* Logo skeleton */}
        <div className="flex-shrink-0 w-28 h-28 bg-gray-300 rounded-lg"></div>
        {/* Info skeleton */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="h-10 bg-gray-300 rounded w-3/4"></div>
          <div className="h-6 bg-gray-300 rounded w-full"></div>
          <div className="h-6 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    </section>
  )
}

export function StatsSkeleton() {
  return (
    <section className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card p-6 flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </section>
  )
}

export function CredentialsSkeleton() {
  return (
    <section className="bg-gray-50 py-10 animate-pulse">
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactSkeleton() {
  return (
    <section className="bg-gray-100 py-10 animate-pulse">
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-16"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function UniversityPageSkeleton() {
  return (
    <div className="flex flex-col">
      <UniversityHeroSkeleton />
      <StatsSkeleton />
      <CredentialsSkeleton />
      <ContactSkeleton />
    </div>
  )
}