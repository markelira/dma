/**
 * Design tokens for DMA platform
 * Centralized design system tokens for consistent styling
 */

// Brand gradient
export const brandGradient = 'linear-gradient(to bottom, #16222F 0%, #466C95 100%)';

export const cardStyles = {
  base: 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md',
  elevated: 'bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-xl',
  flat: 'bg-white rounded-lg border border-gray-200 overflow-hidden',
  glassmorphism: 'bg-white/80 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden',
}

export const buttonStyles = {
  primary: 'px-6 py-3 bg-gray-900 hover:bg-black text-white font-medium rounded-full transition-colors duration-200',
  secondary: 'px-6 py-3 bg-transparent hover:bg-gray-100 text-gray-900 font-medium rounded-full border border-gray-300 transition-colors duration-200',
  outline: 'px-6 py-3 bg-transparent hover:bg-gray-50 text-gray-700 font-medium rounded-full border border-gray-300 transition-colors duration-200',
  ghost: 'px-6 py-3 bg-transparent hover:bg-gray-100 text-gray-700 font-medium rounded-full transition-colors duration-200',
  link: 'text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline',
}

export const colors = {
  primary: '#111827', // gray-900
  secondary: '#6B7280', // gray-500
  accent: '#3B82F6', // blue-500
  success: '#10B981', // green-500
  warning: '#F59E0B', // yellow-500
  error: '#EF4444', // red-500
  background: '#F9FAFB', // gray-50
  surface: '#FFFFFF',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
  }
}

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
}

export const typography = {
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
}
