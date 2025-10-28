import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useResponsive } from './useResponsive';

export const useMobileOptimization = () => {
  const { isMobile } = useResponsive();

  const optimizedQuery = useCallback((queryFn: any, options: any) => {
    return useQuery({
      ...options,
      queryFn,
      staleTime: isMobile ? 10 * 60 * 1000 : 5 * 60 * 1000, // Longer cache on mobile
      refetchOnWindowFocus: !isMobile, // Don't refetch on mobile
    });
  }, [isMobile]);

  return { optimizedQuery };
}; 