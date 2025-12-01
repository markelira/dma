'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Göndör János',
    review: 'Együttműködésünk során új szintre emeltük cégünk működését. Olyan vállalati struktúrát sikerült kialakítani amivel alapot képeztünk a további fejlődésnek. Köszönet mindenért!',
  },
  {
    name: 'Joe Buránszki',
    review: 'A legjobban azt szeretem, hogy könnyen használható életszerű információt kaptam a cég működésében. És ehhez kaptam egy jó alap rendszert, amiben tudok nap mint nap gondolkodni és jobban tudok tervezni. Közérthető és nem bonyolult, pont olyan aminek egy hozzánk hasonló méretű cégnek szüksége van.',
  },
  {
    name: 'Máté Kiss',
    review: 'Kiváló, felkészült csapat. Arra törekszenek, hogy gyakorlatban is hasznosítható tudást adjanak át, segítve a vállalkozásokat belső folyamataik, rendszereik kiépítésében, fejlesztésében.',
  },
  {
    name: 'Dóra Hodosi-Bodnár',
    review: 'A DMA-s képzések miatt határozottan fejlődnek a személyes képességeim. Könnyebben tudom kezelni a konfliktusokat, és az esetlegesen felmerülő problémákat. A csapatban való együttműködés is egyszerűbbé vált, és a meetingek alkalmával sokkal jobban odafigyelünk egymásra mind a munkahelyen, mind a magánéletben.',
  },
  {
    name: 'Balázs Végső',
    review: 'Amióta a DMA-nál tanulok, konzultálok, jobban tudom kezelni az embereket, helyreállt a kommunikáció a cégben az alvállalkozóimmal és az alkalmazottakkal. Folyamatosan fejlődik a személyiségem, nőtt az önbizalmam, illetve azonnal alkalmazható tudást szerzek.',
  },
  {
    name: 'Viktória Vass',
    review: 'A DMA olyan tudást adott át nekem amivel a lehető legegyszerűbben stressz mentesen oldom meg a problémákat, konfliktus helyzeteket. Megmutatta a dolgok pozitív oldalát. Rendszert hozott a munkahelyi életünkbe könnyítve ezzel is mindenki dolgát.',
  },
  {
    name: 'Imre Ling',
    review: 'A képzésen elhangzott ismereteket hasznosan lehet azonnal alkalmazni a gyakorlatban. Ezáltal hatékonyabban működik a cég, stressz mentessé válik és sokkal nagyobb eredményeket lehet elérni. A DMA, jól felépített struktúra segítségével sikeressé teszi a vállalatot.',
  },
  {
    name: 'Miklos Molnar',
    review: 'Hatékony képzések ami nem csak a vállalkozásomat segíti elő, hanem a személyiség fejlődésben is sokat segít. Igazi vezetőkkel tanulhatok, akik hasonlóképpen gondolkodnak. A képzések eredményeképpen a vállalkozásom hatékonyabb.',
  },
  {
    name: 'Csaba Dániel Varga',
    review: 'Varga Csaba Dániel vagyok az Aranykorona Történelmi Étterem munkatársa és már nagyon régóta dolgozunk együtt a DMA-val. Az együttműködés során elértük azt, hogy motiváltan, hatékonyabban tudnak a munkatársak együtt dolgozni a célunkon.',
  },
  {
    name: 'István Oláh',
    review: 'DMA segíti a vállalkozásokat a céljaik elérésében. Segít a munkatársaknak és tulajdonosoknak a hatékonyabb munkavégzésben, saját céljaik kitűzésében és elérésében. Teljes átfogó cég irányítást ad. A személyes fejlődés és jó hangulat garantált!',
  },
  {
    name: 'Attila Bíró',
    review: 'Már egy éve dolgozunk együtt. Csak jó tapasztalataim vannak. Nagyon profi csapat, mindenkinek csak ajánlani tudom, aki szeretne használható segítséget kapni a cége fejlesztésében.',
  },
  {
    name: 'Ottó Kerekes',
    review: 'A DMA nagyon sokat segített a vállalkozásunkba, hogy az precizen és biztonságosan működhessen. Ezen kívül a kommunikációdat is fejlesztheted, ami az élet minden részén fontos lehet.',
  },
  {
    name: 'Benjamin Szabó',
    review: 'Hatalmas segítséget nyújtanak a munkám elvégzéséhez. Nem csak elméleti hanem gyakorlati tanácsokkal és útmutatásokkal segítenek hogy egyszerűbben, hatékonyabban végezzem a munkámat. Csak ajánlani tudom.',
  },
]

function StarRating() {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  )
}

export function TestimonialsEditorial() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <section className="w-full bg-[rgb(249,250,251)] py-20 md:py-28 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Header - Editorial Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Vélemények
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-xs font-medium text-gray-600">Google Reviews</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] tracking-[-0.01em]">
              Amit ügyfeleink
              <br />
              <span className="text-[#E72B36]">mondanak rólunk</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed border-l-2 border-gray-300 pl-4 sm:pl-6">
              Több száz cégvezető és vállalkozó bízik bennünk. Olvasd el, mit mondanak az együttműködésről.
            </p>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative group">
          {/* Navigation Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-2 sm:-left-4 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 hover:scale-105"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-2 sm:-right-4 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 hover:scale-105"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px] bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Stars and Google */}
                <div className="flex items-center justify-between mb-4">
                  <StarRating />
                  <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>

                {/* Review Text */}
                <p className="text-gray-700 leading-relaxed mb-6 line-clamp-5">
                  {testimonial.review}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">{testimonial.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
