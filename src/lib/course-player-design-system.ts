/**
 * Course Player Design System
 * Professional e-learning design tokens matching Udemy/LinkedIn Learning standards
 */

// Professional e-learning color palette
export const playerColors = {
  // Primary colors
  primary: '#E72B36',      // DMA red - main actions, links
  primaryHover: '#c9232d', // Darker red for hover states
  primaryLight: '#FFE6E8', // Light red for backgrounds

  // Secondary colors
  secondary: '#E72B36',    // DMA red - highlights, active states
  secondaryLight: '#FFE6E8',

  // Status colors
  success: '#10B981',      // Completion green
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Attention amber
  warningLight: '#FEF3C7',
  danger: '#EF4444',       // Error red
  dangerLight: '#FEE2E2',

  // Neutral colors
  neutral: '#F3F4F6',      // Background gray
  neutralDark: '#E5E7EB',

  // Text colors
  textPrimary: '#1F2937',    // Dark gray - main text
  textSecondary: '#6B7280',  // Medium gray - secondary text
  textTertiary: '#9CA3AF',   // Light gray - disabled text

  // Border colors
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
  borderFocus: '#E72B36',

  // Surface colors
  surfaceWhite: '#FFFFFF',
  surfaceGray: '#F9FAFB',
  surfaceHover: '#F3F4F6'
}

// Typography scale - Inter font family
export const playerTypography = {
  // Headings
  h1: 'text-[32px] font-bold leading-tight tracking-[-0.3px]',
  h2: 'text-2xl font-bold leading-snug tracking-[-0.3px]',
  h3: 'text-lg font-bold leading-normal tracking-[-0.3px]',
  h4: 'text-base font-bold leading-normal',

  // Body text
  body: 'text-sm font-normal leading-relaxed',
  bodyLarge: 'text-base font-normal leading-relaxed',
  bodySmall: 'text-xs font-normal leading-snug',

  // Labels
  label: 'text-sm font-medium leading-normal',
  labelSmall: 'text-xs font-medium leading-snug',

  // Special
  caption: 'text-xs font-normal leading-tight text-gray-500',
  overline: 'text-xs font-bold uppercase tracking-wide'
}

// Spacing system (based on 8px grid)
export const playerSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem'    // 64px
}

// Component styles
export const playerComponents = {
  // Cards
  card: 'bg-white rounded-lg shadow-sm border border-gray-200',
  cardElevated: 'bg-white rounded-lg shadow-md border border-gray-200',
  cardHover: 'hover:shadow-md hover:border-gray-300 transition-all duration-200',
  cardActive: 'bg-brand-secondary/5 border-brand-secondary/20 shadow-sm',

  // Buttons
  buttonPrimary: 'bg-brand-secondary hover:bg-brand-secondary-hover text-white font-medium rounded-lg px-4 py-2.5 transition-colors duration-200',
  buttonSecondary: 'bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 rounded-lg px-4 py-2.5 transition-colors duration-200',
  buttonGhost: 'bg-transparent hover:bg-gray-100 text-gray-700 font-medium rounded-lg px-4 py-2.5 transition-colors duration-200',
  buttonSuccess: 'bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg px-4 py-2.5 transition-colors duration-200',

  // Progress indicators
  progressRing: 'relative inline-flex items-center justify-center',
  progressBar: 'w-full bg-gray-200 rounded-full h-2 overflow-hidden',
  progressBarFill: 'h-full bg-brand-secondary rounded-full transition-all duration-300 ease-out',

  // Badges
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgeBlue: 'bg-brand-secondary/10 text-brand-secondary',
  badgeGreen: 'bg-green-100 text-green-800',
  badgeGray: 'bg-gray-100 text-gray-800',
  badgeYellow: 'bg-yellow-100 text-yellow-800',

  // Icons
  iconSmall: 'w-4 h-4',
  iconMedium: 'w-5 h-5',
  iconLarge: 'w-6 h-6',
  iconXLarge: 'w-8 h-8',

  // Sidebar
  sidebar: 'bg-white border-r border-gray-200 overflow-y-auto',
  sidebarHeader: 'p-6 border-b border-gray-200',
  sidebarContent: 'p-4 space-y-3',

  // Module/Lesson items
  moduleHeader: 'flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150',
  lessonItem: 'flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all duration-150',
  lessonItemHover: 'hover:bg-gray-50 hover:border-gray-200',
  lessonItemActive: 'bg-brand-secondary/5 border-brand-secondary/20 border-l-4 border-l-brand-secondary',
  lessonItemCompleted: 'bg-green-50 border-green-200',

  // Tabs
  tabsList: 'flex border-b border-gray-200',
  tabButton: 'px-4 py-3 font-medium text-sm text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300 transition-all duration-150',
  tabButtonActive: 'text-brand-secondary border-b-2 border-brand-secondary',

  // Input fields
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition-shadow duration-200',

  // Tooltips
  tooltip: 'bg-gray-900 text-white text-xs rounded py-1 px-2 shadow-lg',

  // Dividers
  divider: 'border-t border-gray-200',

  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2'
}

// Shadow system
export const playerShadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
}

// Border radius
export const playerBorderRadius = {
  sm: '0.25rem',   // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px'   // Fully rounded
}

// Transitions
export const playerTransitions = {
  fast: 'transition-all duration-100 ease-in-out',
  base: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',

  // Specific property transitions
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out'
}

// Animation keyframes (for Tailwind config or inline styles)
export const playerAnimations = {
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  slideInLeft: 'animate-slideInLeft',
  slideInRight: 'animate-slideInRight',
  slideInDown: 'animate-slideInDown',
  scaleIn: 'animate-scaleIn',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin'
}

// Breakpoints (matches Tailwind defaults)
export const playerBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// Z-index scale
export const playerZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  sidebar: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80
}

// Helper functions
export const getProgressColor = (percentage: number): string => {
  if (percentage === 0) return playerColors.textTertiary
  if (percentage === 100) return playerColors.success
  return playerColors.primary
}

export const getLessonTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    VIDEO: playerColors.primary,
    QUIZ: playerColors.warning,
    TEXT: playerColors.textSecondary,
    PDF: playerColors.danger,
    AUDIO: playerColors.secondary,
    READING: playerColors.textSecondary
  }
  return colorMap[type] || playerColors.textSecondary
}

export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '< 1m'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export const calculateModuleProgress = (lessons: any[]): number => {
  if (!lessons || lessons.length === 0) return 0
  const completed = lessons.filter(l =>
    l.progress?.completed || l.progress?.watchPercentage >= 90
  ).length
  return Math.round((completed / lessons.length) * 100)
}
