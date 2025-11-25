'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { GradientText } from './shared/GradientText';

export function SecuritySection() {
  const features = [
    {
      icon: Shield,
      title: 'Biztonságos fizetés',
      description: 'Stripe integráció a legmagasabb szintű biztonsággal',
    },
    {
      icon: Lock,
      title: 'Adatvédelem',
      description: 'GDPR kompatibilis adatkezelés és titkosítás',
    },
    {
      icon: Eye,
      title: 'Privát tanulás',
      description: 'Te döntöd el, mit osztasz meg és kivel',
    },
    {
      icon: CheckCircle2,
      title: 'Minőségi tartalom',
      description: 'Minden tartalmat szakértők ellenőriznek',
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 bg-[#0D1117] overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-green-600/5 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          {/* Left column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            {/* Security dashboard mockup */}
            <div className="relative rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-green-400" />
                  <span className="text-white font-bold">Biztonsági Központ</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                  <span className="text-xs text-green-400 font-medium">Aktív</span>
                </div>
              </div>

              {/* Security checks */}
              <div className="space-y-3">
                {[
                  { label: '2FA Autentikáció', status: 'active' },
                  { label: 'SSL Titkosítás', status: 'active' },
                  { label: 'Adatmentés', status: 'active' },
                  { label: 'GDPR Megfelelés', status: 'active' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800"
                  >
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-400">Aktív</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
                <div>
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-xs text-gray-500">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">256-bit</div>
                  <div className="text-xs text-gray-500">Titkosítás</div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, rotate: -5 }}
              whileInView={{ opacity: 1, rotate: -3 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -right-6 bg-gray-900 border border-green-500/30 rounded-lg p-4 shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white font-medium">Bank-szintű biztonság</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Text content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6 order-1 lg:order-2"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Biztonság & Minőség</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              <GradientText
                from="from-green-400"
                via="via-emerald-400"
                to="to-teal-400"
              >
                Biztonság
              </GradientText>
              <br />
              <span className="text-white">mindenekelőtt</span>
            </h2>

            {/* Description */}
            <p className="text-lg lg:text-xl text-gray-400 leading-relaxed">
              A te adataid és tanulási élményed védelme a legfontosabb.
              Bank-szintű titkosítás és folyamatos monitoring.
            </p>

            {/* Features grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-white font-bold">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
