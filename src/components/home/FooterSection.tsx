'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const footerLinks = {
  tartalmak: [
    { label: 'Webinárok', href: '/webinar' },
    { label: 'Akadémia', href: '/akadémia' },
    { label: 'Masterclass', href: '/masterclass' },
    { label: 'Összes tartalom', href: '/courses' },
  ],
  ceg: [
    { label: 'Rólunk', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Karrier', href: '/careers' },
    { label: 'Kapcsolat', href: '/contact' },
  ],
  segitseg: [
    { label: 'GYIK', href: '/faq' },
    { label: 'Súgó', href: '/help' },
    { label: 'Árazás', href: '/pricing' },
    { label: 'Támogatás', href: '/support' },
  ],
  jogi: [
    { label: 'ÁSZF', href: '/terms' },
    { label: 'Adatvédelem', href: '/privacy' },
    { label: 'Cookie szabályzat', href: '/cookies' },
    { label: 'Impresszum', href: '/impressum' },
  ],
};

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
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

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-[rgb(18,17,17)] overflow-hidden">
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgb(41,41,41)] to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 md:px-12 py-16 md:py-20">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Brand column */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[rgb(231,43,54)] flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-white font-bold text-2xl">DMA</span>
            </Link>

            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              Professzionális online képzések a digitális marketing világában.
              Fejleszd tudásod a legújabb eszközökkel és stratégiákkal.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Tartalmak
            </h3>
            <ul className="space-y-3">
              {footerLinks.tartalmak.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/50 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Cég
            </h3>
            <ul className="space-y-3">
              {footerLinks.ceg.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/50 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Segítség
            </h3>
            <ul className="space-y-3">
              {footerLinks.segitseg.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/50 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Jogi
            </h3>
            <ul className="space-y-3">
              {footerLinks.jogi.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/50 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Newsletter section */}
        <motion.div
          className="mt-16 pt-10 border-t border-white/10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">
                Iratkozz fel hírlevelünkre
              </h3>
              <p className="text-white/50 text-sm">
                Kapj értesítést új tartalmakról és exkluzív kedvezményekről.
              </p>
            </div>

            <form className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="email@example.com"
                className="flex-1 md:w-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[rgb(231,43,54)] transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[rgb(231,43,54)] text-white font-semibold text-sm transition-all duration-300 hover:bg-[rgb(200,35,45)] hover:shadow-[0_0_30px_rgba(231,43,54,0.3)]"
              >
                Feliratkozás
              </button>
            </form>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/40 text-sm">
            &copy; {currentYear} DMA - Digital Marketing Academy. Minden jog fenntartva.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-white/40 text-xs">Készült ❤️-vel Magyarországon</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/50 text-xs">Minden rendszer működik</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

export default FooterSection;
