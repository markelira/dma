export default function PlayerLoading() {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar skeleton */}
      <div className="hidden md:block w-96 bg-gray-900 border-r border-gray-800 p-4">
        {/* Progress bar skeleton */}
        <div className="mb-6">
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gray-700 animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-gray-800 rounded mt-2 animate-pulse" />
        </div>

        {/* Module list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
              <div className="space-y-2 pl-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-800 rounded-full animate-pulse" />
                    <div className="h-4 flex-1 bg-gray-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6 md:p-8">
        {/* Back link skeleton */}
        <div className="h-5 w-40 bg-gray-800 rounded mb-6 animate-pulse" />

        {/* Video player skeleton */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="aspect-video bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="mt-6 space-y-3">
            <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse" />
            <div className="h-5 w-48 bg-gray-800 rounded animate-pulse" />
          </div>

          {/* Navigation buttons skeleton */}
          <div className="flex justify-between mt-8">
            <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
