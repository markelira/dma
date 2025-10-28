import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  variant?: 'default' | 'narrow' | 'wide' | 'full'
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  background?: 'default' | 'muted' | 'primary' | 'secondary'
  as?: React.ElementType
}

const SectionContainer = React.forwardRef<HTMLElement, SectionContainerProps>(
  ({ 
    className, 
    children, 
    variant = 'default',
    spacing = 'md',
    background = 'default',
    as: Component = 'section',
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      narrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
      wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      full: 'w-full px-4 sm:px-6 lg:px-8',
    }

    const spacingClasses = {
      none: '',
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
      xl: 'py-20',
    }

    const backgroundClasses = {
      default: 'bg-background',
      muted: 'bg-muted',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    }

    return (
      <Component
        ref={ref}
        className={cn(
          backgroundClasses[background],
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        <div className={variantClasses[variant]}>
          {children}
        </div>
      </Component>
    )
  }
)
SectionContainer.displayName = "SectionContainer"

export { SectionContainer } 