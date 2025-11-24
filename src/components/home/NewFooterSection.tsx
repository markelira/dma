'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

export function NewFooterSection() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with email service
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer className="bg-dma-navy text-white">
      {/* CTA Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kezd el a tanulást ma
            </h2>
            <p className="text-lg text-white/80 mb-8">
              7 napos ingyenes próba, korlátlan csapattagokkal.
              Nincs bankkártya szükséges.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-dma-red text-white font-semibold rounded-full shadow-lg hover:bg-dma-red-hover hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Próbáld ki ingyen
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-xl font-semibold mb-2">
              Iratkozz fel hírlevelünkre
            </h3>
            <p className="text-white/70 text-sm mb-6">
              Kapj értesítéseket az új tartalmakról, exkluzív ajánlatokról és
              tanulási tippekről.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-dma-red"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-dma-red text-white font-semibold rounded-full hover:bg-dma-red-hover transition-colors"
              >
                Feliratkozás
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Tartalmak
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Árazás
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Támogatás</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Segítség
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Kapcsolat
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  GYIK
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Jogi</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Adatvédelem
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Felhasználási feltételek
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Kövess minket</h4>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <span className="text-xl">📘</span>
              </a>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <span className="text-xl">💼</span>
              </a>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <span className="text-xl">📺</span>
              </a>
              <a
                href="#"
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <span className="text-xl">📷</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/70">
          <p>© 2025 DMA.hu. Minden jog fenntartva.</p>
        </div>
      </div>
    </footer>
  );
}

