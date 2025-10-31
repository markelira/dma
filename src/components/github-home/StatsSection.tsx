'use client';

import { motion } from 'framer-motion';
import { GradientText } from './shared/GradientText';

export function StatsSection() {
  return (
    <section className="relative py-20 lg:py-28 bg-[#0D1117] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-[#0D1117] to-[#0D1117]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px]" />

      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          {/* Main stat */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-6xl lg:text-7xl font-bold mb-6"
            >
              <GradientText
                from="from-purple-400"
                via="via-pink-500"
                to="to-orange-400"
              >
                90%
              </GradientText>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-2xl lg:text-3xl text-white font-semibold mb-4"
            >
              növekedés a készségekben
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-lg lg:text-xl text-gray-400"
            >
              A hallgatók átlagosan 90%-os javulást tapasztalnak
              <br />
              3 hónap aktív tanulás után a DMA platformon
            </motion.p>
          </div>

          {/* Supporting stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16"
          >
            {[
              { value: '4.9/5', label: 'Átlagos értékelés' },
              { value: '95%', label: 'Befejezési arány' },
              { value: '50K+', label: 'Aktív hallgató' },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
