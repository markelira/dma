import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div' | 'label'
  variant?: 'default' | 'lead' | 'muted' | 'caption' | 'small'
  size?: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl'
  weight?: 'normal' | 'medium' | 'bold'
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    className, 
    children, 
    as = 'p',
    variant = 'default',
    size,
    weight,
    ...props 
  }, ref) => {
    const Component = as

    const variantClasses = {
      default: 'text-foreground',
      lead: 'text-lead text-foreground',
      muted: 'text-muted text-muted-foreground',
      caption: 'text-caption text-muted-foreground',
      small: 'text-sm text-muted-foreground'
    }

    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl'
    }

    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold'
    }

    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          "leading-normal",
          variantClasses[variant],
          size && sizeClasses[size],
          weight && weightClasses[weight],
          className
        ),
        ...props
      },
      children
    )
  }
)
Text.displayName = "Text"

export { Text } 