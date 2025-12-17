export default function WebinarLoading() {
  return (
    <div className="min-h-screen bg-[rgb(249,250,251)]">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />

      {/* Hero skeleton */}
      <div className="w-full h-[60vh] bg-gray-100 animate-pulse flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-80 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
