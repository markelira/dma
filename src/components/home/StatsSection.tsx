'use client'

const stats = [
  {
    value: '8000+',
    label: 'Cég keresett meg minket',
  },
  {
    value: '300+',
    label: 'Előfizető',
  },
  {
    value: '50+',
    label: 'Cégnek építjük folyamatosan a struktúráját',
  },
  {
    value: '15+',
    label: 'Fős mentorcsapat',
  },
]

export function StatsSection() {
  return (
    <section className="w-full bg-[rgb(249,250,251)] py-12 md:py-16">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm"
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#E72B36] leading-none tracking-tight block mb-2">
                {stat.value}
              </span>
              <span className="text-sm md:text-base text-gray-600">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
