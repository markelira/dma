import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The blur intensity level of the card.
   * - 'subtle': Light blur effect (backdrop-blur-sm)
   * - 'medium': Medium blur effect (backdrop-blur-md)
   * - 'strong': Strong blur effect (backdrop-blur-lg)
   */
  blurIntensity?: 'subtle' | 'medium' | 'strong';
  
  /**
   * The border style of the card.
   * - 'none': No border
   * - 'light': Light border (border border-white/10)
   * - 'accent': Accent-colored border (border border-primary/20)
   * - 'gradient': Gradient border effect
   */
  borderStyle?: 'none' | 'light' | 'accent' | 'gradient';
  
  /**
   * The background opacity level.
   * - 'transparent': Almost transparent (bg-white/5 dark:bg-black/5)
   * - 'translucent': Semi-transparent (bg-white/10 dark:bg-black/10)
   * - 'light': Light background (bg-white/20 dark:bg-black/20)
   * - 'medium': Medium background (bg-white/30 dark:bg-black/30)
   * - 'solid': More solid background (bg-white/40 dark:bg-black/40)
   */
  backgroundOpacity?: 'transparent' | 'translucent' | 'light' | 'medium' | 'solid';
  
  /**
   * Whether to add a hover effect to the card.
   */
  hoverEffect?: boolean;
  
  /**
   * The element type to render the card as.
   */
  as?: React.ElementType;
  
  /**
   * Whether to add a premium gradient effect to the card.
   */
  premium?: boolean;
  
  /**
   * The children to render inside the card.
   */
  children: React.ReactNode;
}

export function GlassmorphicCard({
  blurIntensity = 'medium',
  borderStyle = 'light',
  backgroundOpacity = 'light',
  hoverEffect = false,
  premium = false,
  as: Component = 'div',
  className,
  children,
  ...props
}: GlassmorphicCardProps) {
  // Map the blur intensity to the corresponding Tailwind class
  const blurClasses = {
    subtle: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    strong: 'backdrop-blur-lg',
  };
  
  // Map the border style to the corresponding Tailwind classes
  const borderClasses = {
    none: '',
    light: 'border border-white/10',
    accent: 'border border-primary/20',
    gradient: 'border border-transparent relative before:absolute before:inset-0 before:p-[1px] before:rounded-[inherit] before:bg-gradient-to-r before:from-primary/40 before:via-secondary/40 before:to-accent/40 before:-z-10',
  };
  
  // Map the background opacity to the corresponding Tailwind classes
  const backgroundClasses = {
    transparent: 'bg-white/5',
    translucent: 'bg-white/10',
    light: 'bg-white/20',
    medium: 'bg-white/30',
    solid: 'bg-white/40',
  };
  
  // Hover effect classes
  const hoverClasses = hoverEffect
    ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg'
    : '';
  
  // Premium gradient effect
  const premiumClasses = premium
    ? 'bg-gradient-to-br from-primary/20 via-transparent to-secondary/20'
    : backgroundClasses[backgroundOpacity];
  
  return (
    <Component
      className={cn(
        'rounded-xl shadow-md',
        blurClasses[blurIntensity],
        borderClasses[borderStyle],
        premium ? premiumClasses : backgroundClasses[backgroundOpacity],
        hoverClasses,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// Export the various glassmorphic card variants
export const PremiumCard = (props: Omit<GlassmorphicCardProps, 'premium'>) => (
  <GlassmorphicCard
    premium
    borderStyle="gradient"
    blurIntensity="medium"
    hoverEffect
    {...props}
  />
);

export const FeatureCard = (props: Omit<GlassmorphicCardProps, 'blurIntensity' | 'borderStyle' | 'backgroundOpacity'>) => (
  <GlassmorphicCard
    blurIntensity="subtle"
    borderStyle="light"
    backgroundOpacity="translucent"
    {...props}
  />
);

export const ContentCard = (props: Omit<GlassmorphicCardProps, 'blurIntensity' | 'borderStyle' | 'backgroundOpacity'>) => (
  <GlassmorphicCard
    blurIntensity="medium"
    borderStyle="none"
    backgroundOpacity="light"
    {...props}
  />
); 