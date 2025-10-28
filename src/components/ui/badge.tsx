import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'status' | 'metric' | 'default' | 'secondary' | 'outline' | 'destructive';
  color?: 'teal' | 'purple' | 'orange' | 'blue' | 'green' | 'red' | 'yellow';
}

const base = 'inline-flex items-center px-3 py-1 rounded-full font-medium text-xs';
const colorMap = {
  teal: 'bg-primary text-white',
  purple: 'bg-category-purple text-white',
  orange: 'bg-category-orange text-white',
  blue: 'bg-category-blue text-white',
  green: 'bg-category-green text-white',
  red: 'bg-category-red text-white',
  yellow: 'bg-category-yellow text-white',
};
const variants = {
  status: 'shadow-sm',
  metric: 'bg-gray-100 text-gray-900',
  default: 'bg-primary text-white',
  secondary: 'bg-gray-100 text-gray-900',
  outline: 'border border-gray-300 bg-transparent text-gray-700',
  destructive: 'bg-red-500 text-white',
};

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'status', color = 'teal', ...props }) => (
  <span className={cn(base, colorMap[color], variants[variant], className)} {...props} />
); 