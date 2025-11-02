"use client";

import { useEffect, useRef } from "react";
import FramerHero from "./hero";

export default function HeroWithTilt() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;

      const dashboardContainer = heroRef.current.querySelector(
        ".framer-1rv6128-container > div"
      ) as HTMLElement;

      if (!dashboardContainer) return;

      const scrollY = window.scrollY;
      const maxScroll = 500; // Max scroll distance to apply full effect
      const scrollProgress = Math.min(scrollY / maxScroll, 1);

      // Apply tilt transform based on scroll progress
      const rotateX = scrollProgress * 8; // Tilt up to 8 degrees
      const scale = 1 + scrollProgress * 0.05; // Scale up to 1.05

      dashboardContainer.style.transform = `perspective(1200px) rotateX(${rotateX}deg) scale(${scale})`;
    };

    // Replace Framer buttons with custom styled buttons
    const replaceButtons = () => {
      if (!heroRef.current) return;

      // Find the button container
      const buttonContainer = heroRef.current.querySelector(".framer-lso2at");

      if (buttonContainer) {
        // Clear existing buttons
        buttonContainer.innerHTML = "";

        // Add custom styled buttons
        buttonContainer.innerHTML = `
          <a
            class="btn group bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%]"
            href="/register"
            style="text-decoration: none;"
          >
            <span class="relative inline-flex items-center">
              Ingyenes próba
              <span class="ml-1 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </a>
          <a
            class="btn bg-white text-gray-800 shadow-sm hover:bg-gray-50"
            href="/courses"
            style="text-decoration: none; margin-left: 8px;"
          >
            Kurzusok böngészése
          </a>
        `;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    // Use setTimeout to ensure DOM is ready
    setTimeout(replaceButtons, 100);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={heroRef}>
      <FramerHero />
    </div>
  );
}
