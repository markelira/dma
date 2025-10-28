import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md active:scale-[0.98]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        // Apple-inspired variants
        apple: "bg-white text-gray-900 shadow-lg hover:shadow-xl active:scale-[0.98] border border-gray-200/50",
        gradient: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl active:scale-[0.98]",
        premium: "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl active:scale-[0.98]",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 hover:shadow-xl active:scale-[0.98]",
        success: "bg-green-500 text-white shadow-sm hover:bg-green-600 hover:shadow-md active:scale-[0.98]",
        warning: "bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 hover:shadow-md active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-lg rounded-xl",
        icon: "h-10 w-10 rounded-lg",
        iconSm: "h-8 w-8 rounded-md",
        iconLg: "h-12 w-12 rounded-xl",
      },
      loading: {
        true: "cursor-wait",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    asChild = false, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // When using asChild, we need to pass props to the child element
    // and can't add extra elements like icons
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, loading, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {children}
        </Comp>
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Specialized button components for common use cases
export const IconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size' | 'leftIcon' | 'rightIcon'> & { icon: React.ReactNode; size?: 'sm' | 'default' | 'lg' }>(
  ({ icon, size = 'default', ...props }, ref) => {
    const iconSize = size === 'sm' ? 'iconSm' : size === 'lg' ? 'iconLg' : 'icon'
    return (
      <Button
        ref={ref}
        size={iconSize}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export const LoadingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return <Button ref={ref} loading {...props} />
  }
)
LoadingButton.displayName = "LoadingButton"

export { Button, buttonVariants } 