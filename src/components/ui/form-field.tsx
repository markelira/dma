import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  children: React.ReactNode
  layout?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg'
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className, 
    label, 
    description, 
    error, 
    required = false,
    disabled = false,
    children,
    layout = 'vertical',
    size = 'md',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'space-y-1',
      md: 'space-y-2',
      lg: 'space-y-3',
    }

    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    }

    const descriptionSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
    }

    const errorSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
    }

    return (
      <div
        ref={ref}
        className={cn(
          "form-field",
          layout === 'vertical' && sizeClasses[size],
          layout === 'horizontal' && "flex items-start gap-4",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {(label || description) && (
          <div className={cn(
            layout === 'horizontal' && "flex-shrink-0 w-1/3",
            layout === 'vertical' && "w-full"
          )}>
            {label && (
              <label className={cn(
                "block font-medium text-foreground",
                labelSizeClasses[size],
                error && "text-destructive"
              )}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </label>
            )}
            {description && (
              <p className={cn(
                "text-muted-foreground mt-1",
                descriptionSizeClasses[size]
              )}>
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className={cn(
          layout === 'horizontal' && "flex-1",
          layout === 'vertical' && "w-full"
        )}>
          {children}
          {error && (
            <p className={cn(
              "text-destructive mt-1",
              errorSizeClasses[size]
            )}>
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField } 