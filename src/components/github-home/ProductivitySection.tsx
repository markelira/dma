'use client';

import { motion } from 'framer-motion';
import { Check, Zap, TrendingUp, Users } from 'lucide-react';
import { GradientText } from './shared/GradientText';

export function ProductivitySection() {
  const features = [
    {
      icon: Zap,
      text: 'Gyorsabb tanulási sebesség csapattal',
    },
    {
      icon: TrendingUp,
      text: '92%-kal jobb eredmények átlagosan',
    },
    {
      icon: Users,
      text: 'Korlátlan csapattagok hozzáadása',
    },
  ];

  return (
    <section className="relative py-16 lg:py-24 bg-[#0D1117] overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-300">Produktivitás</span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              <span className="text-white">Gyorsítsd fel a</span>
              <br />
              <GradientText
                from="from-brand-secondary"
                via="via-cyan-400"
                to="to-teal-400"
              >
                tanulást csapattal
              </GradientText>
            </h2>

            {/* Description */}
            <p className="text-lg lg:text-xl text-gray-400 leading-relaxed">
              A csapatban való tanulás bizonyítottan hatékonyabb. Ossz meg
              jegyzeteket, vitass meg kérdéseket, és érjetek el eredményeket
              együtt.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-brand-secondary/50/20 to-purple-500/20 border border-brand-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-5 h-5 text-brand-secondary" />
                  </div>
                  <span className="text-gray-300 text-lg">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-800">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="text-4xl font-bold"
                >
                  <GradientText from="from-brand-secondary" to="to-cyan-400">
                    92%
                  </GradientText>
                </motion.div>
                <div className="text-sm text-gray-500 mt-1">
                  Növekedés a teljesítményben
                </div>
              </div>
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl font-bold"
                >
                  <GradientText from="from-purple-400" to="to-pink-400">
                    3x
                  </GradientText>
                </motion.div>
                <div className="text-sm text-gray-500 mt-1">
                  Gyorsabb befejezés
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Visual mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main dashboard mockup */}
            <div className="relative rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/50/5 via-purple-500/5 to-transparent" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-secondary/50 to-purple-500" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      Csapat Irányítópult
                    </div>
                    <div className="text-xs text-gray-500">24 aktív tag</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
              </div>

              {/* Progress bars */}
              <div className="relative z-10 space-y-4">
                {[
                  { label: 'Web Fejlesztés', progress: 85, color: 'bg-brand-secondary/50' },
                  { label: 'UI/UX Design', progress: 65, color: 'bg-purple-500' },
                  { label: 'Data Science', progress: 45, color: 'bg-pink-500' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-gray-500">{item.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Team members */}
              <div className="relative z-10 mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Aktív tagok</span>
                  <span className="text-xs text-gray-600">Most online: 12</span>
                </div>
                <div className="flex -space-x-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-secondary/50 to-purple-500 border-2 border-gray-900"
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center">
                    <span className="text-xs text-gray-400">+16</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stats card */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -5 }}
              whileInView={{ opacity: 1, y: 0, rotate: -3 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-6 -right-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">892</div>
                  <div className="text-xs text-gray-500">Ma befejezve</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
