import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode
  variant?: 'default' | 'centered' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ 
    className, 
    title, 
    description, 
    actions, 
    breadcrumbs,
    variant = 'default',
    size = 'md',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'py-4',
      md: 'py-6',
      lg: 'py-8',
    }

    const variantClasses = {
      default: 'text-left',
      centered: 'text-center',
      minimal: 'text-left',
    }

    return (
      <div
        ref={ref}
        className={cn(
          "border-b bg-background",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {breadcrumbs && (
            <div className="mb-4">
              {breadcrumbs}
            </div>
          )}
          
          <div className={cn(
            "flex items-center justify-between",
            variant === 'centered' && "flex-col gap-4 text-center",
            variant === 'minimal' && "flex-col gap-2"
          )}>
            <div className={cn(
              "flex-1",
              variant === 'centered' && "text-center",
              variant === 'minimal' && "w-full"
            )}>
              <h1 className={cn(
                "font-bold tracking-tight",
                size === 'sm' && "text-2xl",
                size === 'md' && "text-3xl",
                size === 'lg' && "text-4xl"
              )}>
                {title}
              </h1>
              {description && (
                <p className={cn(
                  "mt-2 text-muted-foreground",
                  size === 'sm' && "text-sm",
                  size === 'md' && "text-base",
                  size === 'lg' && "text-lg"
                )}>
                  {description}
                </p>
              )}
            </div>
            
            {actions && (
              <div className={cn(
                "flex items-center gap-2",
                variant === 'centered' && "justify-center",
                variant === 'minimal' && "w-full justify-end"
              )}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageHeader } 