import * as React from "react"
import { cn } from "@/lib/utils"

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  variant?: 'default' | 'display' | 'section' | 'subtitle'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ 
    className, 
    children, 
    level = 1, 
    as,
    variant = 'default',
    ...props 
  }, ref) => {
    const Component = (as || `h${level}`) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

    const getVariantClass = (variant: string, level: number) => {
      switch (variant) {
        case 'default':
          return `heading-${level}`
        case 'display':
          if (level === 1) return 'text-display'
          if (level === 2) return 'text-4xl font-bold leading-tight'
          if (level === 3) return 'text-3xl font-bold leading-tight'
          if (level === 4) return 'text-2xl font-bold leading-snug'
          if (level === 5) return 'text-xl font-bold leading-snug'
          return 'text-lg font-bold leading-snug'
        case 'section':
          if (level === 1) return 'text-3xl font-bold leading-tight'
          if (level === 2) return 'text-2xl font-bold leading-snug'
          if (level === 3) return 'text-xl font-bold leading-snug'
          if (level === 4) return 'text-lg font-bold leading-snug'
          if (level === 5) return 'text-base font-bold leading-normal'
          return 'text-sm font-bold leading-normal uppercase tracking-wide'
        case 'subtitle':
          if (level === 1) return 'text-2xl font-medium leading-snug text-muted-foreground'
          if (level === 2) return 'text-xl font-medium leading-snug text-muted-foreground'
          if (level === 3) return 'text-lg font-medium leading-snug text-muted-foreground'
          if (level === 4) return 'text-base font-medium leading-normal text-muted-foreground'
          if (level === 5) return 'text-sm font-medium leading-normal text-muted-foreground'
          return 'text-xs font-medium leading-normal text-muted-foreground uppercase tracking-wide'
        default:
          return `heading-${level}`
      }
    }

    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          "font-sans tracking-tight",
          getVariantClass(variant, level),
          className
        ),
        ...props
      },
      children
    )
  }
)
Heading.displayName = "Heading"

export { Heading } 