export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Skeleton */}
      <div className="relative h-[60vh] min-h-[500px] max-h-[700px] bg-gray-900">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />

        {/* Content skeleton */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-12 xl:px-20 pb-12">
          <div className="max-w-[1440px] mx-auto">
            {/* Category badge skeleton */}
            <div className="h-6 w-24 bg-gray-800 rounded-full animate-pulse mb-4" />

            {/* Title skeleton */}
            <div className="h-12 w-3/4 bg-gray-800 rounded-lg animate-pulse mb-4" />
            <div className="h-12 w-1/2 bg-gray-800 rounded-lg animate-pulse mb-6" />

            {/* Description skeleton */}
            <div className="h-5 w-full max-w-2xl bg-gray-800/60 rounded animate-pulse mb-2" />
            <div className="h-5 w-4/5 max-w-2xl bg-gray-800/60 rounded animate-pulse mb-6" />

            {/* Buttons skeleton */}
            <div className="flex gap-4">
              <div className="h-12 w-40 bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-12 w-32 bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn Section Skeleton */}
            <div className="py-6 border-b border-gray-800">
              <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-6" />
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gray-700 rounded-full animate-pulse flex-shrink-0 mt-0.5" />
                    <div className="h-5 w-full bg-gray-800/60 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Section Skeleton */}
            <div className="py-6 border-b border-gray-800">
              <div className="h-8 w-40 bg-gray-800 rounded animate-pulse mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="h-6 w-3/4 bg-gray-700 rounded animate-pulse mb-3" />
                    <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Section Skeleton */}
            <div className="py-6">
              <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-6" />
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-6 w-48 bg-gray-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-32 bg-gray-700 rounded animate-pulse mb-3" />
                  <div className="h-4 w-full bg-gray-800/60 rounded animate-pulse mb-2" />
                  <div className="h-4 w-4/5 bg-gray-800/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Enrollment Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 rounded-xl p-6 sticky top-24">
              {/* Thumbnail skeleton */}
              <div className="aspect-video bg-gray-700 rounded-lg animate-pulse mb-6" />

              {/* Price skeleton */}
              <div className="h-10 w-32 bg-gray-700 rounded animate-pulse mb-4" />

              {/* CTA Button skeleton */}
              <div className="h-12 w-full bg-gray-700 rounded-lg animate-pulse mb-6" />

              {/* Features list skeleton */}
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
