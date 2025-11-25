'use client';

import dynamic from 'next/dynamic';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import { HeroCourseShowcase } from '@/components/home/HeroCourseShowcase';
import { CourseTypeShowcase } from '@/components/home/CourseTypeShowcase';
import Footer from '@/components/landing-home/ui/footer';

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

const Solutions = dynamic(
  () => import('@framer/solutions').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Pricing = dynamic(
  () => import('@framer/pricing').then(m => m.default.Responsive || m.default),
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
        {/* Course Carousel Section */}
        <div className="py-12">
          <HeroCourseShowcase maxCourses={8} />
        </div>
        <Features {...fullWidthProps} />
        {/* Masterclass Carousel Section */}
        <div className="py-12">
          <CourseTypeShowcase
            courseType="MASTERCLASS"
            title="Masterclass-ok"
            subtitle="Haladó stratégiák iparági vezetőktől és DMA szakértőktől."
            maxCourses={8}
          />
        </div>
        <Benefits {...fullWidthProps} />
        {/* Webinar Carousel Section */}
        <div className="py-12">
          <CourseTypeShowcase
            courseType="WEBINAR"
            title="Webinárok"
            subtitle="Egy fókusz. Azonnal alkalmazható megoldás."
            maxCourses={8}
          />
        </div>
        <Solutions {...fullWidthProps} />
        <Pricing {...fullWidthProps} />
        {/* Akadémia Carousel Section */}
        <div className="py-12">
          <CourseTypeShowcase
            courseType="ACADEMIA"
            title="Akadémiák"
            subtitle="Alapoktól a mesterszintig. Strukturált programok, mélyebb eredmények."
            maxCourses={8}
          />
        </div>
        <Testimonials {...fullWidthProps} />
        {/* Podcast Carousel Section */}
        <div className="py-12">
          <CourseTypeShowcase
            courseType="PODCAST"
            title="Podcastok"
            subtitle="Fejlődj útközben. Beszélgetések, interjúk, betekintések – bárhol, bármikor."
            maxCourses={8}
          />
        </div>
        <Faq {...fullWidthProps} />
        <Cta {...fullWidthProps} />
        <Footer border={true} />
      </main>
    </div>
  );
}

export default TaskFlowHome;
