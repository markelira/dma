import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
  via?: string;
}

export function GradientText({
  children,
  className,
  from = 'from-blue-400',
  via = 'via-purple-500',
  to = 'to-pink-500',
  ...props
}: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        from,
        via,
        to,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
