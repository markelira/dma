/**
 * Premium Design Tokens - For Company Dashboard
 * Extracted from dma-landing-main
 * Use these tokens for company-specific pages with glassmorphic premium UI
 */

// Color System
export const brandGradient = 'linear-gradient(to bottom, #16222F 0%, #466C95 100%)';

export const colors = {
  primary: '#466C95',      // Blue - main brand color
  accent: '#9333EA',       // Purple-600 - featured/premium
  success: '#10B981',      // Emerald-600 - positive actions
  danger: '#F43F5E',       // Rose-600 - problems/warnings
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

// Glassmorphism Effects
export const glassMorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: `
      0 8px 32px 0 rgba(0, 0, 0, 0.2),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)
    `
  },
  badge: {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px) saturate(200%)',
    WebkitBackdropFilter: 'blur(20px) saturate(200%)',
    border: '1.5px solid rgba(255, 255, 255, 0.25)',
    boxShadow: `
      0 8px 24px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2)
    `
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
  }
};

// Typography Scale
export const typography = {
  h1: 'text-5xl lg:text-7xl font-bold leading-tight',
  h2: 'text-4xl lg:text-5xl font-bold leading-tight',
  h3: 'text-2xl font-bold leading-tight',
  h4: 'text-xl font-bold',
  body: 'text-base lg:text-lg leading-relaxed',
  small: 'text-sm leading-relaxed',
  micro: 'text-xs uppercase tracking-wider font-medium',
};

// Spacing System
export const spacing = {
  section: 'py-24 lg:py-32',
  container: 'max-w-7xl mx-auto px-6 lg:px-8',
  cardPadding: 'p-6 lg:p-10',
  elementGap: 'gap-4 lg:gap-8',
};

// Button Styles (Standardized) - Glassmorphic Pills with Dynamic Contrast
export const buttonStyles = {
  // PRIMARY BUTTONS
  // For DARK backgrounds (hero section with gradient)
  primaryDark: `
    bg-white/95 hover:bg-white
    text-gray-900
    px-6 py-3
    rounded-full
    font-medium text-sm
    shadow-lg hover:shadow-xl
    backdrop-blur-xl
    border border-white/20
    transition-all duration-200
    inline-flex items-center justify-center gap-2
  `,
  // For LIGHT backgrounds (white/gray sections)
  primaryLight: `
    bg-gray-900 hover:bg-black
    text-white
    px-6 py-3
    rounded-full
    font-medium text-sm
    shadow-lg hover:shadow-xl
    backdrop-blur-xl
    border border-gray-900
    transition-all duration-200
    inline-flex items-center justify-center gap-2
  `,

  // SECONDARY BUTTONS
  // For DARK backgrounds
  secondaryDark: `
    bg-white/10 hover:bg-white/20
    text-white
    px-6 py-3
    rounded-full
    font-medium text-sm
    backdrop-blur-xl
    border border-white/30 hover:border-white/40
    transition-all duration-200
    inline-flex items-center justify-center gap-2
  `,
  // For LIGHT backgrounds
  secondaryLight: `
    bg-white hover:bg-gray-50
    text-gray-900
    px-6 py-3
    rounded-full
    font-medium text-sm
    backdrop-blur-xl
    border-2 border-gray-900
    shadow-md hover:shadow-lg
    transition-all duration-200
    inline-flex items-center justify-center gap-2
  `,
};

// Card Styles
export const cardStyles = {
  // For content sections (better readability)
  flat: `
    bg-white
    border border-gray-200
    rounded-xl
    shadow-sm
    hover:shadow-md
    transition-all duration-200
  `,
  // For hero/premium features
  glass: `
    bg-white/8
    backdrop-blur-xl
    border border-white/20
    rounded-2xl
    shadow-lg
  `,
  // For left-accent sections
  accentBorder: `
    bg-white
    border-l-4
    border-t border-r border-b border-gray-200
    rounded-r-lg
    shadow-sm
  `
};

// Animation Presets
export const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6 }
  },
  floatingBadge: {
    animate: { y: [0, -8, 0] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as any }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, delay: 0.2 }
  }
};
