"use client";

import { useEffect, useState, ComponentType } from "react";

// Loading placeholders
const HeroLoading = () => (
  <div
    className="min-h-[90vh] w-full"
    style={{ backgroundColor: "var(--unframer-page-background)" }}
  />
);

const FeaturesLoading = () => (
  <div
    className="min-h-[80vh] w-full"
    style={{ backgroundColor: "rgb(15, 15, 15)" }}
  />
);

const SecurityLoading = () => (
  <div
    className="min-h-[50vh] w-full"
    style={{ backgroundColor: "var(--unframer-page-background)" }}
  />
);

const IntegrationsLoading = () => (
  <div
    className="min-h-[70vh] w-full"
    style={{ backgroundColor: "var(--unframer-page-background)" }}
  />
);

const FooterLoading = () => (
  <div
    className="min-h-[50vh] w-full"
    style={{ backgroundColor: "rgb(15, 15, 15)" }}
  />
);

interface FramerComponents {
  Hero: ComponentType<any>;
  Features: ComponentType<any>;
  Security: ComponentType<any>;
  Integrations: ComponentType<any>;
  Footer: ComponentType<any>;
}

// Helper to load a module with webpack ignore
async function loadFramerModule(modulePath: string) {
  // Use Function constructor to create a dynamic import that webpack won't analyze
  const dynamicImport = new Function('modulePath', 'return import(modulePath)');
  return dynamicImport(modulePath);
}

/**
 * Component that loads all Framer sections only on the client side.
 * This prevents SSR/build-time analysis of the Framer imports.
 */
export function FramerPageContent() {
  const [components, setComponents] = useState<FramerComponents | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load in browser
    if (typeof window === "undefined") return;

    async function loadComponents() {
      try {
        // Use dynamic import paths that webpack won't analyze
        const basePath = '/framer';

        const [heroMod, featuresMod, securityMod, integrationsMod, footerMod] =
          await Promise.all([
            loadFramerModule(`..${basePath}/hero`),
            loadFramerModule(`..${basePath}/features`),
            loadFramerModule(`..${basePath}/security`),
            loadFramerModule(`..${basePath}/integrations`),
            loadFramerModule(`..${basePath}/navigation/footer`),
          ]);

        setComponents({
          Hero: heroMod.default.Responsive || heroMod.default,
          Features: featuresMod.default.Responsive || featuresMod.default,
          Security: securityMod.default.Responsive || securityMod.default,
          Integrations:
            integrationsMod.default.Responsive || integrationsMod.default,
          Footer: footerMod.default.Responsive || footerMod.default,
        });
      } catch (err) {
        console.error("Error loading Framer components:", err);
        setError(err instanceof Error ? err.message : "Failed to load components");
      }
    }

    loadComponents();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading page: {error}</p>
      </div>
    );
  }

  if (!components) {
    // Show loading state while components are being loaded
    return (
      <>
        <HeroLoading />
        <FeaturesLoading />
        <SecurityLoading />
        <IntegrationsLoading />
        <FooterLoading />
      </>
    );
  }

  const { Hero, Features, Security, Integrations, Footer } = components;

  return (
    <>
      <main className="grow">
        {/* Hero Section - Cream background with phone mockup, floating transaction cards */}
        <Hero />

        {/* Features Section - Dark bento grid with 4 feature cards + category cards */}
        <Features />

        {/* Security Section - Light background with badges and signing form UI */}
        <Security />

        {/* Integrations Section - Floating 3D app icons (Magic Eden, Ora, Gamma, etc.) */}
        <Integrations />
      </main>

      {/* Footer - Dark CTA section with email subscription and links */}
      <Footer />
    </>
  );
}
