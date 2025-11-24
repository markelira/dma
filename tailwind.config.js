/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Prevent automatic system dark mode - only use when .dark class is present
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "lg": "1320px", // DMA custom layout width
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui'],
        heading: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui'],
        serif: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui'],
        inter: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'system-ui'],
        academic: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: 'hsl(var(--primary))', // Uses CSS variable (Coursera blue #0056D2 for course player)
          hover: 'hsl(215 100% 35%)', // Darker Coursera blue
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          muted: "hsl(var(--text-muted))",
          disabled: "hsl(var(--text-disabled))",
        },
        bg: {
          primary: "hsl(var(--bg-primary))",
          secondary: "hsl(var(--bg-secondary))",
          muted: "hsl(var(--bg-muted))",
          accent: "hsl(var(--bg-accent))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // DMA Brand Colors (Official)
        brand: {
          primary: '#252F5B', // Main brand color (dark navy blue)
          'primary-hover': '#1a2142', // Darker on hover
          'primary-light': '#3a4a7a', // Lighter variant
          secondary: '#E72B36', // Secondary brand color (red)
          'secondary-hover': '#c9232d', // Darker on hover
          'secondary-light': '#ff4d58', // Lighter variant
        },
        // DMA.hu Brand Colors (legacy from logo)
        dma: {
          red: '#E72B36', // Updated to match brand secondary
          'red-hover': '#c9232d', // Red hover state
          navy: '#252F5B', // Updated to match brand primary
          'navy-hover': '#1a2142', // Navy hover state
          'navy-light': '#3a4a7a', // Lighter navy
          dark: '#25282B', // Dark background
          'dark-alt': '#363B3F', // Alternative dark
          gold: '#DD9933', // Gold accent
          'gray-link': '#AAAAAA', // Secondary links
          'gray-dark': '#333333', // Dark gray
        },
        // Coursera Brand Colors (for homepage replication)
        coursera: {
          blue: '#0056D2', // Primary Coursera blue
          'blue-hover': '#004494', // Darker blue on hover
          'blue-light': '#E3F2FD', // Light blue background
          text: {
            primary: '#1C1C1C', // Primary text color
            secondary: '#6A6F73', // Secondary text color
          },
          bg: {
            light: '#F7F9FA', // Light background
          },
          border: '#E0E0E0', // Border color
        },
        blue: {
          DEFAULT: '#16222F', // DMA primary blue-gray
          light: '#1e2a37',
          navy: '#16222F',
          'navy-light': '#1e2a37',
        },
        category: {
          green: '#10B981',
          blue: '#16222F',
          orange: '#F97316',
          red: '#EF4444',
          purple: '#7C3AED',
          pink: '#EC4899',
          yellow: '#F59E0B',
          cyan: '#06B6D4',
          lime: '#84CC16',
          indigo: '#6366F1',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Academic Harvard/Yale Color Scheme - Full palette from DMA
        academic: {
          primary: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
          slate: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
          stone: {
            50: '#FAFAF9',
            100: '#F5F5F4',
            200: '#E7E5E4',
            300: '#D6D3D1',
            400: '#A8A29E',
            500: '#78716C',
            600: '#57534E',
            700: '#44403C',
            800: '#292524',
            900: '#1C1917',
          },
          amber: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: '1rem', // 16px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem', // 32px
        full: '9999px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scroll-infinite': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'code-1': {
          '0%': { opacity: '0' },
          '2.5%': { opacity: '1' },
          '97.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'code-2': {
          '16.2%': { opacity: '0' },
          '18.75%': { opacity: '1' },
          '97.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'code-3': {
          '32.5%': { opacity: '0' },
          '35%': { opacity: '1' },
          '97.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'code-4': {
          '48.75%': { opacity: '0' },
          '51.25%': { opacity: '1' },
          '97.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'code-5': {
          '65%': { opacity: '0' },
          '72.5%': { opacity: '1' },
          '97.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'code-6': {
          '81.25%': { opacity: '0' },
          '83.75%': { opacity: '1' },
          '97.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'breath': {
          '0%, 100%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'line': {
          '0%, 100%': { left: '0', opacity: '0' },
          '50%': { left: '100%', transform: 'translateX(-100%)' },
          '10%, 40%, 60%, 90%': { opacity: '0' },
          '25%, 75%': { opacity: '1' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'gradient-x': 'gradient-x 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'scroll-infinite': 'scroll-infinite 30s linear infinite',
      },
      spacing: {
        '0': 'var(--space-0)',
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '14': 'var(--space-14)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        '28': 'var(--space-28)',
        '32': 'var(--space-32)',
        'layout': 'var(--gap-layout)',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(16, 23, 42, 0.08)',
        cardDeep: '0 8px 32px 0 rgba(16, 23, 42, 0.16)',
        floating: '0 12px 48px 0 rgba(16, 23, 42, 0.24)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': "linear-gradient(135deg, rgba(22,34,47,0.8), rgba(30,42,55,0.8))",
        'gradient-primary': 'linear-gradient(135deg, #16222F 0%, #1e2a37 50%, #252f3d 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        'gradient-accent': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        'gradient-hero': 'linear-gradient(to bottom, #16222F, #466C95)',
        // Category gradients from DMA
        'category-green': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'category-blue': 'linear-gradient(135deg, #16222F 0%, #1e2a37 100%)',
        'category-orange': 'linear-gradient(135deg, #F97316 0%, #FDBA74 100%)',
        'category-red': 'linear-gradient(135deg, #EF4444 0%, #FCA5A5 100%)',
        'category-purple': 'linear-gradient(135deg, #7C3AED 0%, #C4B5FD 100%)',
        'category-pink': 'linear-gradient(135deg, #EC4899 0%, #F9A8D4 100%)',
        'category-yellow': 'linear-gradient(135deg, #F59E0B 0%, #FDE68A 100%)',
        'category-cyan': 'linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)',
        'category-lime': 'linear-gradient(135deg, #84CC16 0%, #D9F99D 100%)',
        'category-indigo': 'linear-gradient(135deg, #6366F1 0%, #A5B4FC 100%)',
        // Academic gradients from DMA
        'academic-hero': 'linear-gradient(135deg, #F8FAFC 0%, #F5F5F4 25%, #FFFBEB 100%)',
        'academic-section': 'linear-gradient(to bottom right, #F8FAFC 0%, #F5F5F4 100%)',
        'academic-card': 'linear-gradient(to bottom right, rgba(248, 250, 252, 0.6) 0%, rgba(245, 245, 244, 0.6) 100%)',
        'academic-accent': 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
      },
      fontSize: {
        xs: 'var(--font-xs)',
        sm: 'var(--font-sm)',
        base: 'var(--font-base)',
        md: 'var(--font-md)',
        lg: 'var(--font-lg)',
        xl: 'var(--font-xl)',
        '2xl': 'var(--font-2xl)',
        '3xl': 'var(--font-3xl)',
        '4xl': 'var(--font-4xl)',
        '5xl': 'var(--font-5xl)',
        display: 'clamp(2.5rem, 6vw, 4rem)', // DMA responsive display font
        lead: '1.25rem', // DMA lead text size
        muted: 'var(--font-sm)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      lineHeight: {
        tight: 'var(--leading-tight)',
        snug: 'var(--leading-snug)',
        normal: 'var(--leading-normal)',
        relaxed: 'var(--leading-relaxed)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} 