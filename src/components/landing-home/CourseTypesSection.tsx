"use client";

import { useEffect } from "react";
import { GraduationCap, Video, BookOpen, Mic, ArrowRight } from "lucide-react";
import AOS from "aos";
import Link from "next/link";

export default function CourseTypesSection() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  const courseTypes = [
    {
      type: "academia",
      title: "Akadémia",
      icon: GraduationCap,
      description:
        "Ha alapoktól akarsz felépíteni egy készséget vagy rendszert. Hosszabb elkötelezettség, mélyebb eredmények.",
      features: [
        "10-20+ videó szekció",
        "Gyakorlati projektek minden modulhoz",
        "Tanúsítvány a végén",
        "Korlátlan visszanézés",
      ],
      gradient: "from-brand-secondary/50 to-brand-secondary",
      bgGradient: "from-brand-secondary/5 to-blue-100",
      href: "/courses?type=academia",
    },
    {
      type: "webinar",
      title: "Webinár",
      icon: Video,
      description:
        "Ha egy konkrét problémára keresel megoldást. 90 perc, egy téma, azonnal alkalmazható tudás.",
      features: [
        "90 perces fókuszált alkalom",
        "Egy konkrét probléma – egy megoldás",
        "Letölthető munkalapok",
        "Q&A szekció",
      ],
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      href: "/courses?type=webinar",
    },
    {
      type: "masterclass",
      title: "Mesterkurzus",
      icon: BookOpen,
      description:
        "Ha haladó szinten akarsz elmélyülni egy területen. Iparági vezetők és a DMA senior szakértői.",
      features: [
        "20-40+ órányi tartalom",
        "Haladó stratégiák és keretrendszerek",
        "Esettanulmányok valós cégekből",
        "Exkluzív interjúk",
      ],
      gradient: "from-teal-500 to-teal-600",
      bgGradient: "from-teal-50 to-teal-100",
      href: "/courses?type=masterclass",
    },
    {
      type: "podcast",
      title: "Podcast",
      icon: Mic,
      description:
        "Ha útközben akarsz fejlődni. Beszélgetések, interjúk, betekintések – bárhol, bármikor.",
      features: [
        "Audio és videó formátum",
        "Vendég szakértők és cégvezetők",
        "Heti új epizódok",
        "Offline meghallgatás",
      ],
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      href: "/podcast",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Melyik formátum neked való?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            Válaszd ki a céljaid és az időd alapján
          </p>
        </div>

        {/* Course Type Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {courseTypes.map((course, index) => {
            const Icon = course.icon;
            return (
              <div
                key={course.type}
                className="group"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <Link href={course.href}>
                  <div
                    className={`relative h-full overflow-hidden rounded-3xl bg-gradient-to-br ${course.bgGradient} p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/20`}
                  >
                    {/* Icon Circle */}
                    <div className="mb-6 flex items-center justify-center">
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${course.gradient} shadow-xl transition-transform duration-300 group-hover:rotate-12`}
                      >
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-4 text-center text-3xl font-bold text-gray-900">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-6 text-center leading-relaxed text-gray-700">
                      {course.description}
                    </p>

                    {/* Features List */}
                    <ul className="mb-6 space-y-3">
                      {course.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start text-sm text-gray-700"
                        >
                          <span
                            className={`mr-2 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r ${course.gradient}`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Link */}
                    <div className="flex items-center justify-center text-sm font-bold">
                      <span
                        className={`bg-gradient-to-r ${course.gradient} bg-clip-text text-transparent`}
                      >
                        Tudj meg többet
                      </span>
                      <ArrowRight className={`ml-1 h-4 w-4 transition-transform group-hover:translate-x-1 bg-gradient-to-r ${course.gradient} bg-clip-text text-transparent`} />
                    </div>

                    {/* Decorative Gradient Overlay */}
                    <div
                      className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${course.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom Text */}
        <div className="mt-16 text-center" data-aos="fade-up" data-aos-delay="400">
          <p className="text-gray-600">
            <span className="font-bold text-gray-900">Nem tudod, hol kezdd?</span>{" "}
            Próbálj ki egy webinárt – 90 perc alatt megérted, miről szól a DMA módszertan.
          </p>
        </div>
      </div>
    </section>
  );
}
