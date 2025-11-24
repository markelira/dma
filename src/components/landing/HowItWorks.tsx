"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Search, Play, Award, ArrowRight } from 'lucide-react'

const steps = [
  {
    id: 1,
    icon: Search,
    title: 'Válasszon tartalmat',
    description: 'Böngésszen több száz tartalom között, vagy használja a keresőt a tökéletes találat érdekében.',
    color: 'from-primary to-primary',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  {
    id: 2,
    icon: Play,
    title: 'Tanuljon saját tempójában',
    description: 'Videó leckék, gyakorlatok és valós projektek segítségével gyakorlati készségeket szerez.',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  {
    id: 3,
    icon: Award,
    title: 'Szerezzen tanúsítványt',
    description: 'Teljesítse a tartalmat és kapjon elismert tanúsítványt, amelyet megoszthat a LinkedIn profilján.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  }
]

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-32 sm:py-40 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
            Hogyan működik?
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Három egyszerű lépésben kezdje el a tanulási utazását és szerezzen valós készségeket
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm z-10">
                {step.id}
              </div>

              {/* Card */}
              <div className={`${step.bgColor} rounded-2xl p-8 h-full relative overflow-hidden`}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                  <div className={`w-full h-full bg-gradient-to-br ${step.color} rounded-full`} />
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className={`text-xl font-bold ${step.textColor} mb-4`}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (except for last step) */}
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                  >
                    <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Készen áll a következő lépésre?
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Csatlakozzon több ezer diákhoz, akik már elkezdték a tanulási utazásukat az DMA platformon
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Ingyenes regisztráció
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors">
                Tartalmak böngészése
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 