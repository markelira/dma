"use client";

import { motion } from "framer-motion";
import { useTrialCTA } from "@/hooks/useTrialCTA";

const features = [
  {
    title: "Rugalmas tanulás",
    description: "Tanulj saját tempódban, bárhonnan. A tartalmak 24/7 elérhetők minden eszközön.",
    icon: "🎯",
    color: "#E72B36",
  },
  {
    title: "Szakértő oktatók",
    description: "Valós tapasztalattal rendelkező szakemberek osztják meg tudásukat.",
    icon: "👨‍🏫",
    color: "#3B82F6",
  },
  {
    title: "Interaktív tartalom",
    description: "Kvízek, feladatok és projektek segítik a tudás elmélyítését.",
    icon: "📊",
    color: "#10B981",
  },
  {
    title: "Tanúsítványok",
    description: "Sikeres elvégzés után hivatalos tanúsítványt kapsz karriered támogatására.",
    icon: "🏆",
    color: "#F59E0B",
  },
];

const quotes = [
  {
    text: "A legjobb befektetés, amit tehetsz, az a saját tudásodba fektetett befektetés.",
    author: "— Benjamin Franklin",
  },
];

export default function FeaturesSection() {
  const { handleTrialClick } = useTrialCTA();
  return (
    <section
      className="py-8 px-4 md:px-6 lg:px-8"
      style={{ backgroundColor: "rgb(255, 250, 245)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto rounded-3xl overflow-hidden"
        style={{ backgroundColor: "rgb(15, 15, 15)" }}
      >
        {/* Content wrapper */}
        <div className="p-8 md:p-12 lg:p-16">
          {/* Header section */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 mb-16">
            {/* Left - Main headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-xl leading-tight"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              A te karriered, a mi küldetésünk - minden eszközzel támogatunk
            </motion.h2>

            {/* Right - Description + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-6 max-w-sm"
            >
              <p className="text-white/65 text-lg leading-relaxed">
                A haladó eszközöktől a zökkenőmentes navigációig, mindent úgy terveztünk,
                hogy a tanulási élményed emlékezetes legyen.
              </p>
              <button
                onClick={handleTrialClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-colors w-fit"
              >
                Kezdd el most
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>
          </div>

          {/* Bento Grid */}
          <div
            className="rounded-[32px] p-2 border border-gray-800"
            style={{
              backgroundColor: "rgb(18, 18, 18)",
              boxShadow: "0px 1px 0px 8px rgb(23, 23, 23)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Feature cards */}
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="relative rounded-[28px] p-6 md:p-8 overflow-hidden group"
                  style={{ backgroundColor: "rgb(23, 23, 23)" }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl"
                    style={{ backgroundColor: feature.color }}
                  >
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "Figtree, sans-serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-white/65 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[28px]"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${feature.color}, transparent 70%)` }}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom section with quote */}
          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 max-w-2xl mx-auto" style={{ fontFamily: "Figtree, sans-serif" }}>
                Fedezd fel, tanulj és fejlődj{" "}
                <span className="text-white/65">a szakmai közösségünkben.</span>
              </h3>
            </motion.div>

            {/* Feature cards bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {[
                { title: "Marketing & Értékesítés", image: "📈", rotate: 1 },
                { title: "Technológia & AI", image: "🤖", rotate: -1 },
                { title: "Vezetés & Stratégia", image: "💼", rotate: 1 },
              ].map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 * index }}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    backgroundColor: "rgb(23, 23, 23)",
                    transform: `rotate(${card.rotate}deg)`,
                  }}
                >
                  <div className="p-6">
                    <div className="text-5xl mb-4">{card.image}</div>
                    <p className="text-white font-bold">{card.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
