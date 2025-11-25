'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HeroCourseShowcase } from './HeroCourseShowcase';

const SectionLoader = () => (
  <div className="w-full h-96 bg-gray-100 animate-pulse" />
);

const MainHero = dynamic(
  () => import('@framer/main-hero').then((m) => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

interface MainHeroWithCoursesProps {
  width?: string;
  style?: React.CSSProperties;
}

export function MainHeroWithCourses({ width, style }: MainHeroWithCoursesProps) {
  useEffect(() => {
    // Hide the static dashboard image from Framer hero after component mounts
    const hideFramerImage = () => {
      // Target the image container with the hero.png background
      const imageContainers = document.querySelectorAll('[data-framer-name="Padding"]');
      imageContainers.forEach((container) => {
        const element = container as HTMLElement;
        // Check if this is the hero image container by looking for the hero.png source
        const bgImage = window.getComputedStyle(element).backgroundImage;
        if (bgImage.includes('hero.png') || element.querySelector('img[src*="hero.png"]')) {
          element.style.display = 'none';
        }
      });

      // Alternative: hide by looking for the specific layout IDs
      const heroImageById = document.querySelector('[data-framer-name="Padding"][layoutid*="rQDUU8axO"]');
      if (heroImageById) {
        (heroImageById as HTMLElement).style.display = 'none';
      }
    };

    // Run after a short delay to ensure Framer components are mounted
    const timer = setTimeout(hideFramerImage, 100);

    // Also run on window resize in case Framer re-renders
    window.addEventListener('resize', hideFramerImage);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', hideFramerImage);
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Framer Hero (text, buttons, etc.) */}
      <div className="framer-hero-wrapper">
        <MainHero width={width} style={style} />
      </div>

      {/* Custom CSS to hide the hero image */}
      <style jsx global>{`
        /* Hide the Framer hero image by targeting its unique characteristics */
        [data-framer-name="Padding"] {
          /* Only hide if it contains the hero.png */
        }

        /* More specific targeting using layout ID */
        [layoutid="rQDUU8axO"] {
          display: none !important;
        }

        /* Additional selectors for different breakpoints */
        .framer-1edkqgx {
          display: none !important;
        }

        /* Adjust hero spacing since we're removing the image */
        .framer-hero-wrapper {
          padding-bottom: 2rem;
        }
      `}</style>

      {/* Our Course Carousel - replaces the dashboard image */}
      <div className="relative z-10 -mt-12 md:-mt-16">
        <HeroCourseShowcase maxCourses={8} />
      </div>
    </div>
  );
}

export default MainHeroWithCourses;
