import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TouchFriendlyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const TouchFriendlyButton = forwardRef<HTMLButtonElement, TouchFriendlyButtonProps>(
  ({ children, className, ...props }, ref) => (
    <button 
      ref={ref}
      className={cn(
        "min-h-[44px] min-w-[44px] touch-manipulation",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

TouchFriendlyButton.displayName = 'TouchFriendlyButton'; 