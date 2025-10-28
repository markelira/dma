import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Section: React.FC<SectionProps> = ({ className, ...props }) => (
  <section className={cn('py-8 md:py-12', className)} {...props} />
); 