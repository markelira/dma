'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, MouseEvent as ReactMouseEvent } from 'react';

// Platform/Tool logos as placeholder icons
const platforms = [
  { name: 'Meta Business', icon: 'M', color: '#1877F2' },
  { name: 'Google Ads', icon: 'G', color: '#4285F4' },
  { name: 'TikTok Ads', icon: 'T', color: '#000000' },
  { name: 'LinkedIn', icon: 'in', color: '#0A66C2' },
  { name: 'YouTube', icon: '▶', color: '#FF0000' },
  { name: 'Shopify', icon: 'S', color: '#96BF48' },
  { name: 'WordPress', icon: 'W', color: '#21759B' },
  { name: 'Mailchimp', icon: '✉', color: '#FFE01B' },
  { name: 'HubSpot', icon: 'H', color: '#FF7A59' },
  { name: 'Canva', icon: 'C', color: '#00C4CC' },
  { name: 'Stripe', icon: '$', color: '#635BFF' },
  { name: 'Analytics', icon: '📊', color: '#F9AB00' },
];

// 3D Card component with tilt effect
function TiltCard({
  platform,
  index,
}: {
  platform: (typeof platforms)[0];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 25, stiffness: 200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-[rgb(23,23,23)] border border-[rgb(41,41,41)] p-6 h-[140px] flex flex-col items-center justify-center transition-colors duration-300 hover:border-white/20 hover:bg-[rgb(28,28,28)]"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${platform.color}20 0%, transparent 70%)`,
          }}
        />

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${platform.color}15`,
            color: platform.color,
            border: `1px solid ${platform.color}30`,
            transform: 'translateZ(20px)',
          }}
        >
          {platform.icon}
        </div>

        {/* Name */}
        <span
          className="text-white/70 text-sm font-medium text-center group-hover:text-white transition-colors"
          style={{ transform: 'translateZ(10px)' }}
        >
          {platform.name}
        </span>
      </motion.div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

export function IntegrationsSection() {
  return (
    <section className="relative w-full bg-[rgb(15,15,15)] py-24 md:py-32 overflow-hidden">
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 50% at 50% 50%, rgba(231, 43, 54, 0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 md:px-12">
        {/* Section header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 font-medium mb-6">
            Eszközök és platformok
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Tanulj meg mindent, amit a<br />
            <span className="text-[rgb(231,43,54)]">profik használnak</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Tartalmaink a legfontosabb digitális marketing eszközökkel és platformokkal
            foglalkoznak, hogy azonnal alkalmazni tudd a tudásodat.
          </p>
        </motion.div>

        {/* Integration cards grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {platforms.map((platform, index) => (
            <TiltCard key={platform.name} platform={platform} index={index} />
          ))}
        </motion.div>

        {/* Bottom text */}
        <motion.p
          className="text-center text-white/40 text-sm mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          ...és még sok más platform és eszköz
        </motion.p>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <a
            href="/pricing"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[rgb(231,43,54)] text-white font-semibold text-base transition-all duration-300 hover:bg-[rgb(200,35,45)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(231,43,54,0.3)]"
          >
            Csatlakozz most
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default IntegrationsSection;
