'use client';

import dynamic from 'next/dynamic';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import { NetflixCourseCarousel } from '@/components/home/NetflixCourseCarousel';
import { WhyDMASection } from '@/components/home/WhyDMASection';
import { FeaturesEditorial, TartalmakHeader } from '@/components/home/FeaturesEditorial';
import { BenefitsEditorial } from '@/components/home/BenefitsEditorial';
import { StatsSection } from '@/components/home/StatsSection';
import { AllCoursesShowcase } from '@/components/home/AllCoursesShowcase';
import { CategoriesEditorial } from '@/components/home/CategoriesEditorial';
import { PricingEditorial } from '@/components/home/PricingEditorial';
import { TestimonialsEditorial } from '@/components/home/TestimonialsEditorial';
import Footer from '@/components/landing-home/ui/footer';

// Loading placeholder for sections
const SectionLoader = () => (
  <div className="w-full h-96 bg-gray-100 animate-pulse" />
);

const MainHero = dynamic(
  () => import('@framer/main-hero').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Faq = dynamic(
  () => import('@framer/faq').then(m => m.default.Responsive || m.default),
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
        {/* Netflix Course Carousel Section */}
        <NetflixCourseCarousel />
        {/* Why DMA Section - Light background feature cards */}
        <WhyDMASection />
        {/* Tartalmak Header - separate from Bento Grid */}
        <TartalmakHeader />
        <FeaturesEditorial />
        {/* Stats Section - moved from hero */}
        <StatsSection />
        {/* All Courses Carousel - "Tartalmaink" section with all course types */}
        <AllCoursesShowcase />
        {/* Benefits Section - "Miért bízz bennünk?" */}
        <BenefitsEditorial />
        {/* Categories Section - "A Struktúraépítő streaming platform" */}
        <CategoriesEditorial />
        {/* Pricing Section - "Fedezd fel 7 napig teljesen ingyen" */}
        <PricingEditorial />
        {/* Testimonials Section - Google Reviews */}
        <TestimonialsEditorial />
        <Faq {...fullWidthProps} />
        <Footer border={true} />
      </main>
    </div>
  );
}

export default TaskFlowHome;
