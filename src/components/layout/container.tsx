import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Container: React.FC<ContainerProps> = ({ className, ...props }) => (
  <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)} {...props} />
); 