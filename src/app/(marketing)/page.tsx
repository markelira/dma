"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "@/styles/framer.css";

import CustomHero from "@/components/landing-home/CustomHero";
import CompanyLogos from "@/components/landing-home/CompanyLogos";
import BusinessCategories from "@/components/landing-home/BusinessCategories";
import FeaturesPlanet from "@/components/landing-home/FeaturesPlanet";
import LargeTestimonial from "@/components/landing-home/LargeTestimonial";
import Cta from "@/components/landing-home/Cta";
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
        <CustomHero />
        <CompanyLogos />
        <BusinessCategories />
        <FeaturesPlanet />
        <LargeTestimonial />
        <Cta />
      </main>
      <Footer border={true} />
    </div>
  );
}
