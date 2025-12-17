'use client';

import dynamic from 'next/dynamic';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import { NetflixCourseCarousel } from '@/components/home/NetflixCourseCarousel';

// Loading placeholder for sections
const SectionLoader = () => (
  <div className="w-full h-96 bg-gray-100 animate-pulse" />
);

// Above-fold: Hero section
const MainHero = dynamic(
  () => import('@framer/main-hero').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

// Below-fold sections - lazy loaded for performance
const WhyDMASection = dynamic(
  () => import('@/components/home/WhyDMASection').then(m => m.WhyDMASection),
  { ssr: false, loading: SectionLoader }
);

const FeaturesEditorial = dynamic(
  () => import('@/components/home/FeaturesEditorial').then(m => m.FeaturesEditorial),
  { ssr: false, loading: SectionLoader }
);

const TartalmakHeader = dynamic(
  () => import('@/components/home/FeaturesEditorial').then(m => m.TartalmakHeader),
  { ssr: false }
);

const AllCoursesShowcase = dynamic(
  () => import('@/components/home/AllCoursesShowcase').then(m => m.AllCoursesShowcase),
  { ssr: false, loading: SectionLoader }
);

const BenefitsEditorial = dynamic(
  () => import('@/components/home/BenefitsEditorial').then(m => m.BenefitsEditorial),
  { ssr: false, loading: SectionLoader }
);

const CategoriesEditorial = dynamic(
  () => import('@/components/home/CategoriesEditorial').then(m => m.CategoriesEditorial),
  { ssr: false, loading: SectionLoader }
);

const PricingEditorial = dynamic(
  () => import('@/components/home/PricingEditorial').then(m => m.PricingEditorial),
  { ssr: false, loading: SectionLoader }
);

const TestimonialsEditorial = dynamic(
  () => import('@/components/home/TestimonialsEditorial').then(m => m.TestimonialsEditorial),
  { ssr: false, loading: SectionLoader }
);

const HomepageFAQ = dynamic(
  () => import('@/components/landing-home/HomepageFAQ'),
  { ssr: false, loading: SectionLoader }
);

const Footer = dynamic(
  () => import('@/components/landing-home/ui/footer'),
  { ssr: false }
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
        <HomepageFAQ />
        <Footer border={true} />
      </main>
    </div>
  );
}

export default TaskFlowHome;
