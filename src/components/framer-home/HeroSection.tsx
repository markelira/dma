"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section
      className="min-h-screen pt-32 pb-20 px-6 lg:px-12"
      style={{ backgroundColor: "rgb(255, 250, 245)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Hero Content */}
        <div className="text-center mb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
          >
            <span className="text-sm font-medium" style={{ color: "rgb(18, 17, 17)" }}>
              Professzionális online tartalmak
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{
              fontFamily: "Figtree, sans-serif",
              color: "rgb(18, 17, 17)"
            }}
          >
            Gyorsítsd fel a<br />
            <span style={{ color: "rgb(231, 43, 54)" }}>karriered</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "rgba(18, 17, 17, 0.7)" }}
          >
            Tanulj a legjobbaktól. Szakértők által vezetett tartalmak marketing,
            technológia és üzleti területeken.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/courses"
              className="px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
              style={{ backgroundColor: "rgb(18, 17, 17)" }}
            >
              Tartalmak felfedezése
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-full font-bold border-2 transition-all hover:scale-105"
              style={{
                borderColor: "rgb(18, 17, 17)",
                color: "rgb(18, 17, 17)"
              }}
            >
              Árak megtekintése
            </Link>
          </motion.div>
        </div>

        {/* Hero Image/Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-4xl mx-auto"
        >
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "rgb(15, 15, 15)" }}
          >
            {/* Course catalog mockup */}
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>

              {/* Mock course cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Marketing Masterclass", category: "Marketing", color: "#E72B36" },
                  { title: "AI & Automatizáció", category: "Technológia", color: "#3B82F6" },
                  { title: "Üzleti Stratégia", category: "Business", color: "#10B981" },
                ].map((course, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: "rgb(23, 23, 23)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                      style={{ backgroundColor: course.color }}
                    >
                      <span className="text-white text-xl">📚</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{course.category}</p>
                    <h3 className="text-white font-bold">{course.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 top-1/4 bg-white rounded-2xl p-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white">✓</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">1000+</p>
                <p className="text-xs text-gray-500">Aktív hallgató</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                <span className="text-white">⭐</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">4.9/5</p>
                <p className="text-xs text-gray-500">Átlagos értékelés</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
