'use client';

import { useEffect } from 'react';

export function HideHeroImage() {
  useEffect(() => {
    // Function to find and hide the hero dashboard image
    const hideImage = () => {
      // Wait a bit for Framer to render
      setTimeout(() => {
        // Find the image by its background or src attribute
        const allDivs = document.querySelectorAll('div[style*="background"]');

        allDivs.forEach((div) => {
          const style = (div as HTMLElement).style;
          const bgImage = style.backgroundImage || '';

          // Check if this div has the hero.png background
          if (bgImage.includes('hero.png')) {
            console.log('🎯 Found hero.png background, hiding it...');
            (div as HTMLElement).style.display = 'none';
          }
        });

        // Also check for img tags
        const allImages = document.querySelectorAll('img');
        allImages.forEach((img) => {
          if (img.src && img.src.includes('hero.png')) {
            console.log('🎯 Found hero.png img tag, hiding it...');
            img.style.display = 'none';
            // Also hide parent container
            if (img.parentElement) {
              img.parentElement.style.display = 'none';
            }
          }
        });

        // Target by specific Framer class that we know contains the image
        const heroImageContainer = document.querySelector('.framer-1edkqgx');
        if (heroImageContainer) {
          console.log('🎯 Found hero image container by class, hiding it...');
          (heroImageContainer as HTMLElement).style.display = 'none';
        }
      }, 500); // Wait 500ms for Framer to render
    };

    hideImage();

    // Re-run on window resize in case Framer re-renders
    window.addEventListener('resize', hideImage);

    return () => {
      window.removeEventListener('resize', hideImage);
    };
  }, []);

  return null; // This component doesn't render anything
}
