'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Star, Award } from 'lucide-react';
import { GradientText } from './shared/GradientText';

export function CommunitySection() {
  return (
    <section className="relative py-16 lg:py-24 bg-[#0D1117]">
      <div className="relative z-10 mx-auto px-8 lg:px-12 max-w-[1280px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto space-y-12"
        >
          {/* Main content */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-6xl lg:text-8xl font-bold"
            >
              <GradientText
                from="from-blue-400"
                via="via-cyan-400"
                to="to-teal-400"
              >
                56,000+
              </GradientText>
            </motion.div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Hallgató tanul velünk világszerte
            </h2>

            <p className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto">
              Csatlakozz a legnagyobb magyar nyelvű e-learning közösséghez
            </p>
          </div>

          {/* Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-8"
          >
            {[
              { icon: Users, value: '200+', label: 'Aktív tartalom' },
              { icon: TrendingUp, value: '95%', label: 'Sikeres végzés' },
              { icon: Star, value: '4.9/5', label: 'Értékelés' },
              { icon: Award, value: '50+', label: 'Szakértő oktató' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* User avatars */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center gap-4 pt-8"
          >
            <div className="flex -space-x-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-4 border-[#0D1117] bg-gradient-to-br from-blue-500 to-purple-500"
                />
              ))}
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">50,000+ hallgató</div>
              <div className="text-sm text-gray-500">tanul már velünk</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
