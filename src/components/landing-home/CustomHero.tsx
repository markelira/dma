"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomHero() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 500;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const rotateX = scrollProgress * 8;
  const scale = 1 + scrollProgress * 0.05;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#e8f4f8] via-[#dde9f0] to-[#d5e3ea] pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-6 text-center">
        {/* Hero Text */}
        <div className="mb-16">
          <h1
            className="mb-6 text-6xl font-bold tracking-tight text-gray-900 md:text-7xl lg:text-8xl"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.2" }}
          >
            Építsd vállalkozásod
            <br />
            struktúrával, ne káosszal
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl">
            Professzionális fejlesztési tartalmak a DMA-tól. Akadémiák, webináriumok
            és mesterkurzusok vállalati vezetőktől és szakértőktől.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-2">
            <a
              className="btn group bg-gradient-to-t from-brand-secondary to-brand-secondary/50 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%]"
              href="/register"
            >
              <span className="relative inline-flex items-center">
                Próbáld ki 7 napig ingyen
                <span className="ml-1 tracking-normal text-brand-secondary-light transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </a>
            <a
              className="btn bg-white text-gray-800 shadow-sm hover:bg-gray-50"
              href="/courses"
            >
              Fedezd fel a tartalmakat
            </a>
          </div>
        </div>

        {/* Dashboard Image with 3D Tilt */}
        <div className="relative" style={{ perspective: "1200px" }}>
          <div
            ref={dashboardRef}
            className="relative mx-auto overflow-hidden rounded-t-xl shadow-2xl transition-transform duration-300"
            style={{
              transform: `perspective(1200px) rotateX(${rotateX}deg) scale(${scale})`,
              transformStyle: "preserve-3d",
              maxWidth: "1072px",
              height: "450px",
            }}
          >
            <img
              src="/dashboard-preview.png"
              alt="Dashboard preview"
              className="h-full w-full object-cover object-top"
              style={{ objectFit: "cover", objectPosition: "top" }}
            />
            {/* Gradient overlay to fade out bottom logos */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0"
              style={{
                height: "35%",
                background:
                  "linear-gradient(to top, rgba(213, 227, 234, 1) 0%, rgba(213, 227, 234, 0.95) 50%, transparent 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
