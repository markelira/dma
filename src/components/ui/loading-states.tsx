export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const SkeletonLoader = ({ className = "h-4 w-full" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
); 