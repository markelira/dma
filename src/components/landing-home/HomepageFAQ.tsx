"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import AOS from "aos";

interface FAQItem {
  question: string;
  answer: string;
}

export default function HomepageFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
    });
  }, []);

  const faqs: FAQItem[] = [
    {
      question: "Miben más a DMA, mint a Coursera vagy az Udemy?",
      answer:
        "A DMA nem általános online tartalmakat kínál. Minden anyagunk a Vállalati Térkép módszertanra épül – egy 20 éve fejlesztett, 50+ cégnél bizonyított rendszerre. Nem inspirációt kapsz, hanem konkrét keretrendszereket, amiket azonnal alkalmazhatsz.",
    },
    {
      question: "Tényleg ingyen kipróbálhatom 7 napig?",
      answer:
        "Igen, teljes hozzáféréssel. Nem kell bankkártya, nincs automatikus terhelés. Ha nem tetszik, egyszerűen nem csinálsz semmit – nem fogunk zaklatni.",
    },
    {
      question: "Mennyi időt igényel?",
      answer:
        "Te döntöd el. Egy webinár 90 perc. Egy akadémia 10-20 szekció, amit a saját tempódban végezhetsz. A podcastokat útközben hallgathatod. Nincs határidő, nincs nyomás.",
    },
    {
      question: "Egyénként és cégként is használhatom?",
      answer:
        "Igen. Egyéni előfizetéssel a saját fejlődésedre koncentrálhatsz. Céges előfizetéssel a teljes csapatod hozzáférést kap, te pedig látod a haladásukat és az eredményeket.",
    },
    {
      question: "Mi van, ha nem tetszik?",
      answer:
        "A 7 napos próba után bármikor lemondhatsz egyetlen kattintással. Nincs hosszú távú elköteleződés, nincs rejtett költség. Ha úgy érzed, nem neked való – nincs harag.",
    },
    {
      question: "Kapok tanúsítványt?",
      answer:
        "Igen, minden befejezett akadémiához és mesterkurzushoz. A tanúsítványt megoszthatod LinkedInen, munkáltatókkal vagy ügyfelekkel. A webinárokhoz és podcastokhoz nem jár tanúsítvány.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--unframer-blue-10)] to-[var(--unframer-beige-10)] py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center" data-aos="fade-up">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Gyakran ismételt kérdések
          </h2>
          <p className="text-lg text-gray-600 md:text-xl">
            Mielőtt elkezded
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4" data-aos="fade-up" data-aos-delay="100">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-white/20 bg-white/60 shadow-lg backdrop-blur-xl transition-all hover:shadow-2xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-white/80"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-bold text-gray-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-brand-secondary transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="border-t border-gray-100/50 px-6 pb-6 pt-4">
                  <p className="leading-relaxed text-gray-600">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Contact CTA */}
        <div
          className="mt-12 rounded-2xl bg-gradient-to-br from-brand-secondary/5/80 to-purple-50/80 p-8 text-center backdrop-blur-xl border border-white/20"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h3 className="mb-3 text-2xl font-bold text-gray-900">
            Még mindig van kérdésed?
          </h3>
          <p className="mb-6 text-gray-600">
            Írj nekünk, és segítünk megtalálni a választ
          </p>
          <a
            href="mailto:info@dma.hu"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-brand-secondary to-brand-secondary/50 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Kapcsolatfelvétel
            <span className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
