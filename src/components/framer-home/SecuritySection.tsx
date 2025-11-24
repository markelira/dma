"use client";

import { motion } from "framer-motion";

const benefits = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Minőséggarancia",
    description: "Minden kurzusunkat szakértők validálják, hogy a legmagasabb színvonalat biztosítsuk.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Élethosszig tartó hozzáférés",
    description: "Egyszer vásárolj, örökre tanulj. Kurzusaink korlátlanul elérhetők maradnak.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Közösség",
    description: "Csatlakozz egy aktív szakmai közösséghez, ahol támogatást és kapcsolatokat építhetsz.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Gyakorlatorientált",
    description: "Azonnal alkalmazható tudás és készségek, amelyeket a munkahelyen is hasznosíthatsz.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Személyre szabott tanulás",
    description: "Alakítsd ki saját tanulási ütemtervedet és haladj a saját tempódban.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Folyamatos támogatás",
    description: "Oktatóink és csapatunk mindig készen áll, hogy segítsen a kérdéseidben.",
  },
];

export default function SecuritySection() {
  return (
    <section
      className="py-20 md:py-28 px-6 lg:px-12 relative overflow-hidden"
      style={{
        backgroundColor: "rgb(255, 250, 245)",
        background: "linear-gradient(180deg, rgb(255, 250, 245) 0%, rgb(242, 239, 235) 100%)",
      }}
    >
      {/* Background stripes decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(0,0,0,0.02) 120px, rgba(0,0,0,0.02) 121px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: "rgba(231, 43, 54, 0.1)",
              color: "rgb(231, 43, 54)",
            }}
          >
            Miért mi?
          </span>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{
              fontFamily: "Figtree, sans-serif",
              color: "rgb(18, 17, 17)",
            }}
          >
            Miért válaszd a{" "}
            <span style={{ color: "rgb(231, 43, 54)" }}>DMA</span>-t?
          </h2>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{ color: "rgba(18, 17, 17, 0.7)" }}
          >
            Olyan tanulási élményt kínálunk, amely nem csak tudást ad, hanem karrieredet is előre lendíti.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              style={{
                borderColor: "rgba(0, 0, 0, 0.06)",
                borderWidth: "1px",
              }}
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: "rgb(255, 250, 245)",
                  color: "rgb(231, 43, 54)",
                }}
              >
                {benefit.icon}
              </div>

              {/* Content */}
              <h3
                className="text-xl font-bold mb-3"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  color: "rgb(18, 17, 17)",
                }}
              >
                {benefit.title}
              </h3>
              <p style={{ color: "rgba(18, 17, 17, 0.7)" }} className="leading-relaxed">
                {benefit.description}
              </p>

              {/* Hover accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: "rgb(231, 43, 54)" }}
              />
            </motion.div>
          ))}
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "50+", label: "Kurzus" },
            { value: "1000+", label: "Hallgató" },
            { value: "4.9", label: "Értékelés" },
            { value: "98%", label: "Elégedettség" },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  color: "rgb(231, 43, 54)",
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: "rgba(18, 17, 17, 0.7)" }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
