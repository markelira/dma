import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",
        outline:
          "border [border-color:var(--button-outline)] shadow-xs active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border",
        ghost: "border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
        // Apple-inspired variants
        apple: "bg-white text-gray-900 shadow-lg hover:shadow-xl border border-gray-200/50",
        gradient: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl",
        premium: "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 hover:shadow-xl",
        success: "bg-green-500 text-white shadow-sm hover:bg-green-600 hover:shadow-md",
        warning: "bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 hover:shadow-md",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 px-3",
        lg: "min-h-10 px-8",
        xl: "h-14 px-10 text-lg rounded-xl",
        icon: "h-9 w-9",
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