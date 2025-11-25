'use client';

import { motion } from 'framer-motion';
import { BentoCard } from './BentoCard';
import { FeatureCardTilted } from './FeatureCardTilted';

// Icons as components
const NotificationIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const TransactionIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CertificateIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
    />
  </svg>
);

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
};

export function FeaturesSection() {
  return (
    <section className="relative w-full bg-[rgb(15,15,15)] py-24 md:py-32 overflow-hidden">
      {/* Subtle gradient at top */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgb(255, 250, 245), rgb(15, 15, 15))',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 md:px-12">
        {/* Section header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 font-medium mb-6">
            Miért válassz minket?
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Minden, amire szükséged van<br />
            <span className="text-[rgb(231,43,54)]">egy helyen</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Modern tanulási élmény, interaktív videók és valós projektek.
            Fejleszd karrieredet a legújabb eszközökkel.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-16 md:mb-20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* Featured card - takes full height on left */}
          <BentoCard
            variant="featured"
            title="Interaktív videóleckék"
            description="HD minőségű oktatóvideók, amelyek lépésről lépésre vezetnek végig minden témán. Visszatekerhetők, újranézhetők."
            icon={<VideoIcon />}
            className="md:row-span-2 min-h-[280px] md:min-h-[400px]"
            delay={0}
          />

          {/* Top right card */}
          <BentoCard
            title="Azonnali értesítések"
            description="Kapj értesítéseket új leckékről, kedvezményekről és fontos frissítésekről."
            icon={<NotificationIcon />}
            className="min-h-[180px]"
            delay={0.1}
          />

          {/* Bottom right card */}
          <BentoCard
            title="Haladáskövető"
            description="Valós idejű statisztikák a tanulási folyamatodról és eredményeidről."
            icon={<ChartIcon />}
            className="min-h-[180px]"
            delay={0.2}
          />
        </motion.div>

        {/* Quote and Stats row */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* Quote card */}
          <BentoCard
            variant="quote"
            title=""
            quote={{
              text: 'A legértékesebb befektetés, amit tehetsz, a saját tudásodba való befektetés.',
              author: 'Benjamin Franklin',
            }}
            className="md:col-span-2 min-h-[220px]"
            delay={0}
          />

          {/* Stat card */}
          <BentoCard
            variant="stat"
            title=""
            stat={{
              value: '98%',
              label: 'elégedett tanuló',
            }}
            className="min-h-[220px]"
            delay={0.1}
          />
        </motion.div>

        {/* Bottom features header */}
        <motion.div
          className="text-center mb-12"
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Fedezd fel tartalmainkat
          </h3>
          <p className="text-white/50 max-w-xl mx-auto">
            Különböző szintű képzések kezdőktől a haladókig
          </p>
        </motion.div>

        {/* Tilted feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <FeatureCardTilted
            title="Meta Ads Alapok"
            description="Ismerd meg a Facebook és Instagram hirdetések világát"
            rotation={-1}
            delay={0}
          />
          <FeatureCardTilted
            title="Google Ads Mestertartalom"
            description="Haladó stratégiák a Google hirdetési platformon"
            rotation={0.5}
            delay={0.15}
          />
          <FeatureCardTilted
            title="E-commerce Marketing"
            description="Webáruházak marketingstratégiái és optimalizálása"
            rotation={1}
            delay={0.3}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <a
            href="/courses"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[rgb(18,17,17)] font-bold text-base transition-all duration-300 hover:bg-[rgb(242,239,235)] hover:-translate-y-0.5 hover:shadow-lg"
          >
            Összes tartalom megtekintése
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;
