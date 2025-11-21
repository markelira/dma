/**
 * Skeleton loading component for the course player
 * Matches the PlayerLayout structure for better UX
 */
export const PlayerSkeleton = () => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="border-l pl-4 flex-1">
              <div className="h-6 w-64 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-2 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar Skeleton */}
        <div className="hidden lg:block w-80 bg-white border-r p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-5 w-40 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Video Player Skeleton */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="bg-gray-900 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-gray-700 border-t-gray-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="h-4 w-32 bg-gray-700 rounded mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="bg-white rounded-lg">
              <div className="border-b flex gap-4 px-6 py-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="p-6 space-y-4">
                <div className="h-5 w-full bg-gray-200 rounded"></div>
                <div className="h-5 w-5/6 bg-gray-200 rounded"></div>
                <div className="h-5 w-4/6 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Navigation Skeleton */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel Skeleton */}
        <div className="hidden xl:block w-80 bg-white border-l p-6">
          <div className="space-y-6">
            <div>
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-full bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
