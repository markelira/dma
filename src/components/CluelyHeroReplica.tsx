'use client'

/**
 * CluelyHeroReplica component
 * Hero section inspired by Cluely design
 */
export function CluelyHeroReplica() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="container mx-auto px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Kezdj el tanulni még ma
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Csatlakozz több ezer diákhoz, akik már fejlesztik készségeiket
          </p>
          <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-100 transition-colors">
            Regisztrálj most
          </button>
        </div>
      </div>
    </section>
  )
}
