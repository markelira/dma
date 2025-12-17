export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-[rgb(249,250,251)]">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />

      {/* Header skeleton */}
      <div className="pt-20 pb-12 text-center">
        <div className="h-10 w-72 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
        <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
      </div>

      {/* Pricing cards skeleton */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
              <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-12 w-32 bg-gray-200 rounded mb-6" />
              <div className="space-y-3 mb-8">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 w-full bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-12 w-full bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
