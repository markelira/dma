'use client'

export function CourseFilterSkeleton() {
  return (
    <section className="container mx-auto px-4 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-10 bg-gray-200 rounded-full ${i === 0 ? 'w-32' : 'w-24'}`}></div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturedCoursesSkeleton() {
  return (
    <section className="bg-gray-50 py-10 animate-pulse">
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[280px] bg-white rounded-lg shadow-card flex flex-col">
              <div className="h-40 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AllCoursesSkeleton() {
  return (
    <section className="container mx-auto px-4 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4 md:mb-0"></div>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-card flex flex-col">
            <div className="h-40 bg-gray-200 rounded-t-lg"></div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
              <div className="flex items-center justify-between mt-auto">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}