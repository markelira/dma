'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const logos = [
  { src: '/images/herocarousel/24hu-logo.png', alt: '24.hu', width: 240, height: 120 },
  { src: '/images/herocarousel/bizalmi-kor-logo.png', alt: 'Bizalmi Kör', width: 240, height: 120 },
  { src: '/images/herocarousel/continental-logo.png', alt: 'Continental', width: 240, height: 120 },
  { src: '/images/herocarousel/forbes-logo.png', alt: 'Forbes', width: 240, height: 120 },
  { src: '/images/herocarousel/haszon-logo.png', alt: 'Haszon', width: 240, height: 120 },
  { src: '/images/herocarousel/mapei-logo.png', alt: 'Mapei', width: 240, height: 120 },
  { src: '/images/herocarousel/minicrm-logo.png', alt: 'MiniCRM', width: 240, height: 120 },
  { src: '/images/herocarousel/piacesprofit-logo.png', alt: 'Piac és Profit', width: 240, height: 120 },
  { src: '/images/herocarousel/portfolio-logo.png', alt: 'Portfolio', width: 240, height: 120 },
  { src: '/images/herocarousel/semsei-logo.png', alt: 'Semsei', width: 240, height: 120 },
  { src: '/images/herocarousel/szabo-peter-logo.png', alt: 'Szabó Péter', width: 240, height: 120 },
  { src: '/images/herocarousel/szentkiralyi-logo.png', alt: 'Szentkirályi', width: 240, height: 120 },
]

export function SocialProofLogos() {
  // Triple duplicate for seamless infinite loop
  const infiniteLogos = [...logos, ...logos, ...logos]

  return (
    <div className="w-full bg-transparent py-8 sm:py-12 overflow-hidden relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading - Z-index ensures visibility above background */}
        <h2 className="text-center text-white text-lg sm:text-xl font-bold mb-8 sm:mb-12 relative z-50">
          Akikkel már együtt dolgoztunk:
        </h2>

        {/* True Infinite Horizontal Carousel */}
        <div className="relative">
          <motion.div
            className="flex items-center gap-12 sm:gap-16"
            animate={{
              x: [0, '-33.333%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
          >
            {infiniteLogos.map((logo, index) => (
              <div
                key={`${logo.alt}-${index}`}
                className="relative flex items-center justify-center flex-shrink-0 group h-18"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                  style={{ height: `${logo.height}px`, width: 'auto' }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
