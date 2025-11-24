'use client';

import { motion } from 'framer-motion';

// Icons
const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const LockIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const features = [
  {
    icon: <ShieldIcon />,
    title: 'Biztonságos fizetés',
    description: 'Stripe által biztosított, bank-szintű titkosítással védett fizetési rendszer.',
  },
  {
    icon: <LockIcon />,
    title: 'Élethosszig tartó hozzáférés',
    description: 'Megvásárolt tartalmaidhoz korlátlan ideig hozzáférsz, bármikor visszanézheted.',
  },
  {
    icon: <CheckCircleIcon />,
    title: 'Minőségi garancia',
    description: '30 napos pénzvisszafizetési garancia, ha nem vagy elégedett a tartalommal.',
  },
  {
    icon: <HeartIcon />,
    title: 'Támogató közösség',
    description: 'Csatlakozz aktív közösségünkhöz, ahol kérdéseidre választ kaphatsz.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
};

export function SecuritySection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background with gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgb(15, 15, 15) 0%, rgb(242, 239, 235) 100%)',
        }}
      />

      {/* Stripe pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 1px,
            rgba(0, 0, 0, 0.05) 1px,
            rgba(0, 0, 0, 0.05) 2px
          )`,
          backgroundSize: '4px 100%',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 md:px-12 py-24 md:py-32">
        {/* Section header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-[rgb(231,43,54)]/10 border border-[rgb(231,43,54)]/20 text-sm text-[rgb(231,43,54)] font-medium mb-6">
            Miért bízhatsz bennünk?
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Biztonság és{' '}
            <span className="text-[rgb(231,43,54)]">megbízhatóság</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Garantált minőség, biztonságos fizetés és élethosszig tartó hozzáférés
            minden tartalmunkhoz.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative"
              variants={itemVariants}
            >
              {/* Card */}
              <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10 p-8 h-full transition-all duration-300 hover:bg-white/20 hover:border-white/20 hover:shadow-xl hover:-translate-y-1">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[rgb(231,43,54)]/10 border border-[rgb(231,43,54)]/20 flex items-center justify-center mb-6 text-[rgb(231,43,54)] transition-colors group-hover:bg-[rgb(231,43,54)]/20">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          className="mt-20 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-[rgb(41,41,41)]" />
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white/70 text-sm font-medium">SSL védelem aktív</span>
            </div>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-[rgb(41,41,41)]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default SecuritySection;
