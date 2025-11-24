'use client';

import dynamic from 'next/dynamic';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';

// Loading placeholder for sections
const SectionLoader = () => (
  <div className="w-full h-96 bg-gray-100 animate-pulse" />
);

const MainHero = dynamic(
  () => import('@framer/main-hero').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Features = dynamic(
  () => import('@framer/features').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Benefits = dynamic(
  () => import('@framer/benefits').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const VideoSection = dynamic(
  () => import('@framer/video-section').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Solutions = dynamic(
  () => import('@framer/solutions').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Pricing = dynamic(
  () => import('@framer/pricing').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const BlogSection = dynamic(
  () => import('@framer/blog-section').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Testimonials = dynamic(
  () => import('@framer/testimonials').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Faq = dynamic(
  () => import('@framer/faq').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Cta = dynamic(
  () => import('@framer/cta').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const FramerFooter = dynamic(
  () => import('@framer/footer').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

// Common props for full-width Framer sections
const fullWidthProps = {
  width: '100%',
  style: { width: '100%', maxWidth: '100%' },
};

export function TaskFlowHome() {
  return (
    <div className="w-full min-h-screen bg-[rgb(249,250,251)] overflow-x-hidden">
      {/* Navbar from /courses page */}
      <FramerNavbarWrapper />
      {/* Main content - all sections full width */}
      <main className="w-full">
        <MainHero {...fullWidthProps} />
        <Features {...fullWidthProps} />
        <Benefits {...fullWidthProps} />
        <VideoSection {...fullWidthProps} />
        <Solutions {...fullWidthProps} />
        <Pricing {...fullWidthProps} />
        <BlogSection {...fullWidthProps} />
        <Testimonials {...fullWidthProps} />
        <Faq {...fullWidthProps} />
        <Cta {...fullWidthProps} />
        <FramerFooter {...fullWidthProps} />
      </main>
    </div>
  );
}

export default TaskFlowHome;
