'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Users, BookOpen, Award, Share2, CheckCircle } from 'lucide-react';
import { BentoGrid, BentoCard } from './shared/BentoGrid';
import { GradientText } from './shared/GradientText';

export function CollaborationSection() {
  return (
    <section className="relative py-16 lg:py-24 bg-[#0D1117]">
      {/* Background effects */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px]">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm mb-6">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Együttműködés</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-white">Tanuljatok </span>
            <GradientText
              from="from-purple-400"
              via="via-pink-500"
              to="to-orange-400"
            >
              együtt,
            </GradientText>
            <br />
            <span className="text-white">érjetek célt gyorsabban</span>
          </h2>

          <p className="text-lg lg:text-xl text-gray-400">
            Minden eszköz egy helyen a hatékony csapatmunkához
          </p>
        </motion.div>

        {/* Bento Grid */}
        <BentoGrid className="mb-16">
          {/* Card 1: Discussion */}
          <BentoCard colSpan={2}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Csapat Megbeszélések
                </h3>
              </div>

              <p className="text-gray-400 mb-6">
                Valós idejű chat, fórumok és Q&A minden tartalomhoz. Oszd meg
                gondolataidat és tanulj másoktól.
              </p>

              {/* Chat mockup */}
              <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-800 space-y-3">
                {[
                  { name: 'Anna', message: 'Valaki segítene a 3. feladatban?', time: '2m' },
                  { name: 'Péter', message: 'Persze! Mit nem értesz?', time: '1m' },
                  { name: 'Te', message: 'Küldd el a kódot, megnézem 👀', time: 'most' },
                ].map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-secondary/50 to-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{msg.name}</span>
                        <span className="text-xs text-gray-600">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-400">{msg.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 2: Shared Notes */}
          <BentoCard>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-secondary/50/20 to-cyan-500/20 border border-brand-secondary/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-brand-secondary" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Megosztott Jegyzetek
                </h3>
              </div>

              <p className="text-gray-400 mb-4">
                Készíts és ossz meg jegyzeteket a csapatoddal valós időben.
              </p>

              {/* Notes mockup */}
              <div className="flex-1 space-y-2">
                {['JavaScript alapok', 'React hooks', 'API integráció'].map((note, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-300">{note}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 3: Progress Tracking */}
          <BentoCard>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Haladás Követés
                </h3>
              </div>

              <p className="text-gray-400 mb-4">
                Lásd a csapatod előrehaladását és motiváljátok egymást.
              </p>

              {/* Progress circles */}
              <div className="flex-1 flex items-center justify-center gap-4">
                {[75, 60, 90].map((percent, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative w-16 h-16"
                  >
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-800"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                        whileInView={{
                          strokeDashoffset: 2 * Math.PI * 28 * (1 - percent / 100),
                        }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className="text-green-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{percent}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 4: Team Achievements */}
          <BentoCard colSpan={2}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Közös Eredmények
                </h3>
              </div>

              <p className="text-gray-400 mb-6">
                Érjetek el mérföldköveket együtt és ünnepeljétek a sikereket.
              </p>

              {/* Achievements grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: '🏆', title: 'Első hét', count: 12 },
                  { icon: '⭐', title: 'Befejezett', count: 45 },
                  { icon: '🔥', title: 'Sorozat', count: '7 nap' },
                ].map((achievement, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors text-center"
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="text-sm text-gray-500 mb-1">{achievement.title}</div>
                    <div className="text-lg font-bold text-white">{achievement.count}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </section>
  );
}
