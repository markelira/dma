'use client'

import { useState } from 'react'
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
    question: 'Hogyan kezdjem el az első tartalmamat?',
    answer: 'Miután bejelentkezett, látogasson el a "Beiratkozásaim" vagy "Böngészés" oldalra. Válassza ki a kívánt tartalmat, és kattintson a "Beiratkozás" gombra. A tartalom azonnal elérhető lesz az Ön számára.'
  },
  {
    question: 'Mit tartalmaz az előfizetésem?',
    answer: 'Az előfizetés korlátlan hozzáférést biztosít az összes tartalomhoz, beleértve az új tartalmakat is. Csapattagokat korlátlanul hívhat meg, és minden befejezett tartalomhoz tanúsítványt kap.'
  },
  {
    question: 'Hogyan működik a 7 napos ingyenes próbaidőszak?',
    answer: 'Az első 7 napban ingyenesen használhatja a platformot. A 7. nap után automatikusan megterheljük a bankkártyáját, kivéve ha korábban lemondja az előfizetést. Lemondás esetén nem számítunk fel díjat.'
  },
  {
    question: 'Hogyan adhatok hozzá csapattagokat?',
    answer: 'Látogasson el a "Vállalat" menüpontra, ahol meghívhat csapattagokat e-mail címük megadásával. Ők automatikusan hozzáférést kapnak az összes tartalomhoz, amíg az Ön előfizetése aktív.'
  },
  {
    question: 'Milyen fizetési módokat fogadnak el?',
    answer: 'Elfogadunk minden fontosabb bankkártyát (Visa, Mastercard, American Express). A fizetés biztonságos, titkosított kapcsolaton keresztül történik a Stripe segítségével.'
  },
  {
    question: 'Hogyan tudom lemondani az előfizetésemet?',
    answer: 'Az "Előfizetés" menüpontban bármikor lemondhatja előfizetését. A lemondás után a következő fizetési ciklusig még hozzáférhet a tartalmakhoz.'
  },
  {
    question: 'Kaphatok számlát?',
    answer: 'Igen, minden fizetésről automatikusan számlát állítunk ki, amelyeket a "Számlák" menüpontban érhet el és tölthet le.'
  },
  {
    question: 'Van pénzvisszafizetési garancia?',
    answer: 'Igen, 30 napos pénzvisszafizetési garanciát biztosítunk. Ha nem elégedett, kérdések nélkül visszatérítjük a díjat.'
  },
  {
    question: 'Hogyan érem el a tanúsítványaimat?',
    answer: 'Miután befejez egy tartalmat (az összes leckét megtekinti és a vizsgát sikeresen teljesíti), a tanúsítvány automatikusan elérhető lesz a tartalom oldalán.'
  },
  {
    question: 'Mi történik, ha lejár az előfizetésem?',
    answer: 'Az előfizetés lejárta után elveszíti a hozzáférést a tartalmakhoz. Azonban a tanulási előrehaladása és a megszerzett tanúsítványai megmaradnak, és újra hozzáférhet hozzájuk, ha megújítja az előfizetést.'
  }
]

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
      <div className="max-w-3xl space-y-6">

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
              onClick={() => window.location.href = 'mailto:support@dma.hu'}
            >
              support@dma.hu
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <MessageCircle className="w-8 h-8 text-brand-secondary mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Élő chat
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Beszéljen egy támogatási munkatárssal
            </p>
            <Button className="w-full bg-brand-secondary hover:bg-brand-secondary-hover">
              Chat indítása
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
            Nem találja amit keres?
          </h3>
          <p className="text-gray-600 mb-4">
            Látogasson el a teljes tudásbázisunkba, ahol részletes útmutatókat és videókat talál
            a platform használatához.
          </p>
          <Button variant="outline" className="border-brand-secondary/30 text-brand-secondary hover:bg-brand-secondary/10">
            Tudásbázis megtekintése
          </Button>
        </div>
      </div>
    </div>
  )
}
