"use client";

import { useEffect } from "react";
import { Map, Users, Target } from "lucide-react";
import AOS from "aos";

export default function ValueClaritySection() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  const values = [
    {
      icon: Map,
      title: "A Vállalati Térkép módszertan",
      description:
        "Nem random videókat nézel – a DMA strukturált módszertanát kapod, amit 20 éve fejlesztünk és 50+ cégnél bizonyított. Minden tartalom erre épül.",
      gradient: "from-brand-secondary/50 to-brand-secondary",
      bgGradient: "from-brand-secondary/5/80 to-blue-100/80",
    },
    {
      icon: Users,
      title: "15+ aktív mentor",
      description:
        "A DMA mentorcsapata és meghívott szakértők, akik napi szinten dolgoznak cégvezetőkkel. Nem elméleti oktatók – gyakorló szakemberek.",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50/80 to-purple-100/80",
    },
    {
      icon: Target,
      title: "Építs, ne csak nézz",
      description:
        "Minden program konkrét feladatokkal zárul. Nem fogsz inspirálódni – rendszereket építesz, amiket azonnal bevezethetsz a cégedben vagy a munkádban.",
      gradient: "from-teal-500 to-teal-600",
      bgGradient: "from-teal-50/80 to-teal-100/80",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--unframer-beige-10)] to-[var(--unframer-blue-10)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Miért a DMA?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            20 év. 8000+ cég. Bevált módszertan.
          </p>
        </div>

        {/* Value Cards */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="group relative"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Card */}
                <div className={`relative h-full rounded-2xl bg-gradient-to-br ${value.bgGradient} p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/20`}>
                  {/* Icon Circle */}
                  <div className="mb-6 flex items-center justify-center">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${value.gradient} shadow-lg transition-transform duration-300 group-hover:rotate-12`}
                    >
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="mb-4 text-center text-2xl font-bold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-center leading-relaxed text-gray-600">
                    {value.description}
                  </p>

                  {/* Decorative Gradient Overlay */}
                  <div
                    className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${value.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center" data-aos="fade-up" data-aos-delay="400">
          <p className="mb-4 text-lg text-gray-700">
            Készen állsz a következő lépésre?
          </p>
          <a
            href="/courses"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-brand-secondary to-brand-secondary/50 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Fedezd fel a tartalmakat
            <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
