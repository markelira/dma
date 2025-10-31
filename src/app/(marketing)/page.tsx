"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import Hero from "@/components/landing-home/HeroHome";
import BusinessCategories from "@/components/landing-home/BusinessCategories";
import FeaturesPlanet from "@/components/landing-home/FeaturesPlanet";
import LargeTestimonial from "@/components/landing-home/LargeTestimonial";
import Cta from "@/components/landing-home/Cta";
import Header from "@/components/landing-home/ui/header";
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
      <Header />
      <main className="grow">
        <Hero />
        <BusinessCategories />
        <FeaturesPlanet />
        <LargeTestimonial />
        <Cta />
      </main>
      <Footer border={true} />
    </div>
  );
}
