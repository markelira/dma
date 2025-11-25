"use client"
import React from 'react'
import { Container } from '@/components/layout/container'
import { Card } from '@/components/ui/card'
import { Award, Clock, Users, BookOpen, Shield, Zap } from 'lucide-react'

export const WhyDMA: React.FC = () => {
  const features = [
    { 
      id: 'expertise', 
      title: 'Sokszínű Szakértelem', 
      description: 'Tanuljon egyetemi professzoroktól és vezető céges szakértőktől',
      icon: Award,
      color: 'from-primary to-primary',
      bgColor: 'bg-brand-secondary/5',
      textColor: 'text-brand-secondary-hover'
    },
    { 
      id: 'applicability', 
      title: 'Valós Alkalmazhatóság', 
      description: 'Gyakorlati projektek azonnali eredményekkel és valós üzleti problémák megoldásával',
      icon: Zap,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    { 
      id: 'flexibility', 
      title: 'Teljesen Rugalmas', 
      description: 'Saját tempó, bármikor, bárhol, élethosszig tartó hozzáférés',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    { 
      id: 'community', 
      title: 'Aktív Közösség', 
      description: 'Csatlakozzon több ezer diákhoz és szakértőhöz, akik támogatják fejlődését',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    { 
      id: 'certification', 
      title: 'Elismert Tanúsítványok', 
      description: 'Szakmai tanúsítványok, amelyeket a munkaerőpiac elismer és értékel',
      icon: BookOpen,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    { 
      id: 'guarantee', 
      title: '100% Garancia', 
      description: '30 napos visszatérítési garancia és élethosszig tartó hozzáférés',
      icon: Shield,
      color: 'from-primary to-primary',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
    }
  ]

  return (
    <section id="why-dma" className="py-32 sm:py-40 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl"></div>
      </div>

      <Container className="max-w-7xl relative">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Miért az DMA?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Egyedülálló kombinációja a szakértelemnek, gyakorlatias megközelítésnek és rugalmas tanulási lehetőségeknek
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card 
                key={feature.id} 
                className="group p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white relative overflow-hidden"
              >
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${feature.textColor}`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover effect line */}
                <div className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r ${feature.color} group-hover:w-full transition-all duration-300`}></div>
              </Card>
            )
          })}
        </div>

        {/* Bottom stats section */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15,000+</div>
              <div className="text-gray-600">Aktív diák</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-gray-600">Elégedettség</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">200+</div>
              <div className="text-gray-600">Tartalom</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Szakértő oktató</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
} 