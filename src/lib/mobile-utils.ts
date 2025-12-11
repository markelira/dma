/**
 * Mobile-First Utility Classes and Constants
 *
 * Target devices:
 * - Standard phones: 375px - 428px
 * - Large phones/phablets: 428px - 640px
 * - Tablets: 640px - 1024px
 * - Desktop: 1024px+
 */

export const mobileBreakpoints = {
  phone: '375px',      // iPhone SE, small phones
  phoneLg: '428px',    // iPhone Pro Max, large phones
  tablet: '640px',     // sm: breakpoint
  desktop: '1024px',   // lg: breakpoint
  wide: '1440px',      // max content width
} as const;

/**
 * Mobile-first container padding
 * Starts with mobile (16px) and scales up
 */
export const containerPadding = {
  mobile: 'px-4',        // 16px for 375px screens
  mobileLg: 'sm:px-5',   // 20px for 428px+ screens
  tablet: 'md:px-6',     // 24px for 768px+ screens
  desktop: 'lg:px-12',   // 48px for 1024px+ screens
  wide: 'xl:px-20',      // 80px for 1280px+ screens
} as const;

/**
 * Mobile-first spacing utilities
 */
export const spacing = {
  section: {
    mobile: 'py-8',      // 32px vertical
    tablet: 'md:py-12', // 48px vertical
    desktop: 'lg:py-16', // 64px vertical
  },
  gap: {
    mobile: 'gap-4',     // 16px gap
    tablet: 'md:gap-6',  // 24px gap
    desktop: 'lg:gap-8', // 32px gap
  },
  hero: {
    mobile: 'pt-20 pb-8',     // 80px top (navbar), 32px bottom
    tablet: 'md:pt-24 md:pb-12', // 96px top, 48px bottom
    desktop: 'lg:pt-28 lg:pb-16', // 112px top, 64px bottom
  },
} as const;

/**
 * Mobile-first typography scale
 */
export const typography = {
  hero: {
    mobile: 'text-3xl',      // 36px
    tablet: 'md:text-4xl',   // 48px
    desktop: 'lg:text-5xl',  // 60px
  },
  h1: {
    mobile: 'text-2xl',      // 30px
    tablet: 'md:text-3xl',   // 36px
    desktop: 'lg:text-4xl',  // 48px
  },
  h2: {
    mobile: 'text-xl',       // 24px
    tablet: 'md:text-2xl',   // 30px
    desktop: 'lg:text-3xl',  // 36px
  },
  h3: {
    mobile: 'text-lg',       // 20px
    tablet: 'md:text-xl',    // 24px
    desktop: 'lg:text-2xl',  // 30px
  },
  body: {
    mobile: 'text-base',     // 18px
    tablet: 'md:text-lg',    // 20px
  },
  small: {
    mobile: 'text-sm',       // 16px
  },
} as const;

/**
 * Touch-friendly target sizes (minimum 44px per Apple HIG / 48px per Material)
 */
export const touchTargets = {
  button: 'min-h-[48px] px-6 py-3',
  iconButton: 'min-w-[48px] min-h-[48px] p-3',
  input: 'min-h-[56px] px-4 py-3',
  checkbox: 'min-w-[24px] min-h-[24px]',
} as const;

/**
 * Mobile-first grid layouts
 */
export const gridLayouts = {
  oneToTwo: 'grid-cols-1 md:grid-cols-2',
  oneToThree: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  oneToFour: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  twoToFour: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
} as const;

/**
 * Utility function to combine mobile-first classes
 */
export function mobileContainer(maxWidth: 'narrow' | 'content' | 'wide' = 'wide'): string {
  const widths = {
    narrow: 'max-w-4xl',   // 896px
    content: 'max-w-7xl',  // 1280px
    wide: 'max-w-[1440px]', // 1440px
  };

  return `w-full mx-auto ${widths[maxWidth]} ${Object.values(containerPadding).join(' ')}`;
}

/**
 * Utility function for mobile-first hero sections
 */
export function mobileHero(): string {
  return `${Object.values(spacing.hero).join(' ')}`;
}

/**
 * Utility function for mobile-first section spacing
 */
export function mobileSection(): string {
  return `${Object.values(spacing.section).join(' ')}`;
}
