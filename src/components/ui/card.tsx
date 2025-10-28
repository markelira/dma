import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'category' | 'university' | 'feature' | 'floating';
  color?: string; // for category cards
}

const base = 'rounded-2xl overflow-hidden';
const variants = {
  category: (color: string) => `bg-[${color}] text-white flex flex-col items-center justify-center shadow-card h-40 md:h-48`,
  university: 'bg-white border border-gray-200 shadow-card p-6 flex flex-col gap-3',
  feature: 'bg-white shadow-card p-6 rounded-2xl',
  floating: 'bg-white/80 backdrop-blur-lg shadow-floating p-8 rounded-3xl',
};

export const Card: React.FC<CardProps> = ({ className, variant = 'feature', color, ...props }) => {
  const variantClass =
    variant === 'category' && color
      ? variants.category(color)
      : typeof variants[variant] === 'string'
      ? variants[variant]
      : '';
  return <div className={cn(base, variantClass, className)} {...props} />;
};

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 