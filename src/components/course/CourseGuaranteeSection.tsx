'use client';

import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function CourseGuaranteeSection() {
  return (
    <div className="container mx-auto px-6 lg:px-12 py-16">
      <motion.section
        className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-10 text-center shadow-lg border border-blue-200"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          30 Napos Pénzvisszafizetési Garancia
        </h2>

        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          Ha a kurzus nem felel meg az elvárásaidnak, 30 napon belül teljes visszatérítést biztosítunk,
          kérdések nélkül. A te megelégedettséged a legfontosabb számunkra.
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <p className="text-sm font-semibold text-gray-900">100% Garancia</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <p className="text-sm font-semibold text-gray-900">Nincs kockázat</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <p className="text-sm font-semibold text-gray-900">Azonnali visszatérítés</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
