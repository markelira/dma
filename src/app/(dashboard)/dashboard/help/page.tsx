'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, ChevronDown, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Help Page
 *
 * Simple FAQ and support contact page
 */

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'Miben más a DMA Masterclass?',
    answer: 'A DMA Masterclasson 20 év tapasztalatából összerakott, működő és azonnal alkalmazható cégépítési rendszereket kapsz szakértő Mentoroktól.'
  },
  {
    question: 'Tényleg kipróbálhatom 7 napig ingyen?',
    answer: 'Igen. Sikeres regisztráció után 7 napig teljesen ingyenesen tudod felfedezni a tartalmakat. 7 nap után, ha nem mondod le az előfizetést, akkor 14.990 Ft-ért tudod folytatni a kalandozást.'
  },
  {
    question: 'Munkatársakat is hozzá tudok adni az oldalhoz?',
    answer: 'Igen, teljesen ingyenesen hozzá tudsz adni 5 munkatársat is, akik veled együtt kalandozhatnak a különböző tematikájú tartalmak között.'
  },
  {
    question: 'Mit nézhetek a DMA Masterclasson?',
    answer: 'A 150+ cégépítési rendszer elérhető az oldalon. Felfedzheted az Ügyvezetés, a HR, a Marketing, az Értékesítés és a Működés területeihez tartozó több, mint 200 órányi tartalmat.'
  },
  {
    question: 'Hogyan mondhatom le?',
    answer: 'A profilodon a Számlázás menüpontban találod az előfizetés lemondását. Ha lemondtad az előfizetésed, akkor a fordulónapjáig természetesen továbbra is elérhetőek lesznek a tartalmak, viszont után nem újul meg az előfizetés és elveszted a hozzáférést.'
  }
]

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-6 h-6 text-brand-secondary" />
          <h1 className="text-3xl font-bold text-gray-900">
            Segítség
          </h1>
        </div>
        <p className="text-gray-500">
          Gyakran ismételt kérdések és támogatás
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">

        {/* Contact Support Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <Mail className="w-8 h-8 text-brand-secondary mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              E-mail támogatás
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Írjon nekünk, és 24 órán belül válaszolunk
            </p>
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => window.location.href = 'mailto:info@dma.hu'}
            >
              info@dma.hu
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <MessageCircle className="w-8 h-8 text-brand-secondary mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Segítségkérés
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Küldj egy jegyet a támogatási csapatunknak
            </p>
            <Button
              className="w-full bg-brand-secondary hover:bg-brand-secondary-hover"
              onClick={() => router.push('/dashboard/help-center')}
            >
              Jegy küldése
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Gyakran ismételt kérdések
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-brand-secondary/5 border border-brand-secondary/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Még mindig van kérdésed?
          </h3>
          <p className="text-gray-600 mb-4">
            Írj nekünk, és segítünk megtalálni a választ.
          </p>
          <Button
            variant="outline"
            className="border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary/10"
            onClick={() => window.location.href = 'mailto:info@dma.hu'}
          >
            Kapcsolatfelvétel
          </Button>
        </div>
      </div>
    </div>
  )
}
