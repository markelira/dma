export default function MarketingLoading() {
  return (
    <div className="min-h-screen bg-[rgb(249,250,251)]">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 animate-pulse" />

      {/* Hero skeleton */}
      <div className="w-full h-[70vh] bg-gray-100 animate-pulse" />

      {/* Content sections skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
