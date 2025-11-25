'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const logos = [
  // Client logos
  { src: '/images/companylogos/dma-mapei-logo.png', alt: 'Mapei', width: 120, height: 36 },
  { src: '/images/companylogos/dma-follow-marketing-logo.png', alt: 'Follow Marketing', width: 322, height: 83 }, // 115% of doubled size

  // Media logos
  { src: '/images/companylogos/dma-forbes-logo.png', alt: 'Forbes', width: 100, height: 36 },
  { src: '/images/companylogos/dma-portfolio-logo.png', alt: 'Portfolio', width: 120, height: 36 },
  { src: '/images/companylogos/dma-piacesprofit-logo.png', alt: 'Piac és Profit', width: 84, height: 25 }, // 30% smaller
  { src: '/images/companylogos/dma-penzcentrum-logo.png', alt: 'Pénzcentrum', width: 130, height: 36 },
  { src: '/images/companylogos/dma-haszon-logo-300x300.png', alt: 'Haszon', width: 184, height: 83 }, // 115% of doubled size
  { src: '/images/companylogos/dma-origo-logo-300x300.png', alt: 'Origo', width: 230, height: 83 }, // 115% of doubled size
  { src: '/images/companylogos/dma-24.hu-logo-300x300.png', alt: '24.hu', width: 184, height: 83 }, // 115% of doubled size
  { src: '/images/companylogos/dma-hirado.hu-logo-300x300.png', alt: 'Híradó.hu', width: 230, height: 83 }, // 115% of doubled size
  { src: '/images/companylogos/dma-metropol-logo.png', alt: 'Metropol', width: 276, height: 83 }, // 115% of doubled size
  { src: '/images/companylogos/dma-femcafe-logo.png', alt: 'FemCafé', width: 110, height: 36 },
  { src: '/images/companylogos/dma-hrportal-logo.png', alt: 'HRPortal', width: 110, height: 36 },
]

export function SocialProofLogos() {
  // Triple duplicate for seamless infinite loop
  const infiniteLogos = [...logos, ...logos, ...logos]

  return (
    <div className="w-full bg-transparent py-8 sm:py-12 overflow-hidden relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading - Z-index ensures visibility above background */}
        <h2 className="text-center text-white text-lg sm:text-xl font-bold mb-8 sm:mb-12 relative z-50">
          Ahol már találkozhattál velünk
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
