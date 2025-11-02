import React from 'react';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import { Footer } from '@/components/navigation/footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <FramerNavbarWrapper />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
} 