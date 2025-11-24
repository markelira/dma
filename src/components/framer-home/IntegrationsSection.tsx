"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const categories = [
  { icon: "📈", label: "Marketing", color: "#E72B36", x: -40, y: -20, delay: 0 },
  { icon: "🤖", label: "AI & Tech", color: "#3B82F6", x: 40, y: -30, delay: 0.1 },
  { icon: "💼", label: "Business", color: "#10B981", x: -60, y: 20, delay: 0.2 },
  { icon: "📊", label: "Analitika", color: "#F59E0B", x: 50, y: 15, delay: 0.15 },
  { icon: "🎯", label: "Értékesítés", color: "#8B5CF6", x: -30, y: 50, delay: 0.25 },
  { icon: "💡", label: "Innováció", color: "#EC4899", x: 35, y: 45, delay: 0.3 },
];

export default function IntegrationsSection() {
  return (
    <section
      className="py-24 md:py-32 px-6 lg:px-12 relative overflow-hidden"
      style={{ backgroundColor: "rgb(255, 250, 245)" }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, rgba(231, 43, 54, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Floating icons grid */}
        <div className="relative h-64 md:h-80 mb-12">
          {categories.map((category, index) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: category.delay }}
              animate={{
                y: [0, -10, 0],
                rotate: [0, index % 2 === 0 ? 3 : -3, 0],
              }}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(calc(-50% + ${category.x}%), calc(-50% + ${category.y}%))`,
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-lg"
                  style={{
                    backgroundColor: "white",
                    boxShadow: `0 8px 30px ${category.color}30`,
                  }}
                >
                  {category.icon}
                </div>
                <span
                  className="text-xs md:text-sm font-medium px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                  }}
                >
                  {category.label}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{
              fontFamily: "Figtree, sans-serif",
              color: "rgb(18, 17, 17)",
            }}
          >
            Készen állsz a{" "}
            <span style={{ color: "rgb(231, 43, 54)" }}>változásra</span>?
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: "rgba(18, 17, 17, 0.7)" }}
          >
            Csatlakozz több ezer tanulóhoz, akik már elkezdték építeni jövőjüket.
            Kezdd el még ma az első tartalmadat!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/courses"
              className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
              style={{
                backgroundColor: "rgb(231, 43, 54)",
                boxShadow: "0 4px 20px rgba(231, 43, 54, 0.3)",
              }}
            >
              Böngészd a tartalmakat
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-full font-semibold border-2 transition-all hover:scale-105"
              style={{
                borderColor: "rgb(18, 17, 17)",
                color: "rgb(18, 17, 17)",
              }}
            >
              Előfizetési csomagok
            </Link>
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 pt-8 border-t"
          style={{ borderColor: "rgba(18, 17, 17, 0.1)" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: "rgb(231, 43, 54)" }}
              >
                D
              </div>
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  color: "rgb(18, 17, 17)",
                }}
              >
                DMA
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { label: "Tartalmak", href: "/courses" },
                { label: "Árak", href: "/pricing" },
                { label: "GYIK", href: "/faq" },
                { label: "Kapcsolat", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: "rgba(18, 17, 17, 0.7)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Social links */}
            <div className="flex gap-4">
              {["linkedin", "facebook", "instagram"].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-70"
                  style={{
                    backgroundColor: "rgba(18, 17, 17, 0.05)",
                    color: "rgb(18, 17, 17)",
                  }}
                >
                  {social === "linkedin" && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  )}
                  {social === "facebook" && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.737-.9 10.125-5.864 10.125-11.854z"/>
                    </svg>
                  )}
                  {social === "instagram" && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: "rgba(18, 17, 17, 0.5)" }}>
              © {new Date().getFullYear()} DMA. Minden jog fenntartva.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
