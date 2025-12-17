"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface CourseThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: boolean;
  priority?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-12",
  md: "w-32 h-24", 
  lg: "w-48 h-36",
  xl: "w-64 h-48",
};

export function CourseThumbnail({
  src,
  alt = "Tartalom kép",
  className,
  size = "md",
  fallback = true,
  priority = false
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
  let imageSrc = src;
  if (imageSrc && imageSrc.includes('course-placeholder.png')) {
    imageSrc = '/images/course-card-default.svg'
  }

  if (!imageSrc || error) {
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
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-opacity duration-200",
          loading ? "opacity-0" : "opacity-100"
        )}
        sizes="(max-width: 768px) 100vw, 256px"
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
} 