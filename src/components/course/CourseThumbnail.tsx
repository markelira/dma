"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface CourseThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-12",
  md: "w-32 h-24", 
  lg: "w-48 h-36",
  xl: "w-64 h-48",
};

export function CourseThumbnail({ 
  src, 
  alt = "Kurzus kép", 
  className,
  size = "md",
  fallback = true 
}: CourseThumbnailProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // Replace known missing placeholder path to local default asset
  if (src && src.includes('course-placeholder.png')) {
    src = '/images/course-card-default.svg'
  }

  if (!src || error) {
    if (!fallback) return null;
    
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted rounded-lg",
        sizeClasses[size],
        className
      )}>
        <ImageIcon className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", sizeClasses[size], className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
} 