"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "@/styles/framer.css";

import CustomHero from "@/components/landing-home/CustomHero";
import { FramerNavbarWrapper } from "@/components/navigation/framer-navbar-wrapper";
import Footer from "@/components/landing-home/ui/footer";

export default function Home() {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 700,
      easing: "ease-out-cubic",
    });
  });

  return (
    <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
      <FramerNavbarWrapper />
      <main className="grow">
        {/* Hero - Framer Design */}
        <CustomHero />
      </main>
      <Footer border={true} />
    </div>
  );
}
