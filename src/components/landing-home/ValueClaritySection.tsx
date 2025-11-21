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
      title: "Vállalati Térkép a sikerhez",
      description:
        "Ne tűzolts többet. Tanulj rendszerben, strukturált tanulási útvonalakon, ahol minden lépés a következőre épít.",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50/80 to-blue-100/80",
    },
    {
      icon: Users,
      title: "DMA szakértő oktatók",
      description:
        "Tanulj sikeres vállalatvezetőktől és a DMA szakértőitől, akik megosztják valós tapasztalataikat és bevált módszereiket.",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50/80 to-purple-100/80",
    },
    {
      icon: Target,
      title: "Valós projektek, valós eredmények",
      description:
        "Ne csak tanulj - alkalmazd is. Minden kurzus gyakorlati projektekkel zárul, amit azonnal használhatsz a vállalkozásodban.",
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
            Miért a DMA Akadémia?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            Strukturált tanulás, szakértő oktatók, gyakorlati eredmények
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
                  <h3 className="mb-4 text-center text-2xl font-semibold text-gray-900">
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
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Fedezd fel a kurzusokat
            <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
