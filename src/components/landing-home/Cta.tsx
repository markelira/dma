import Image from "next/image";

export default function Cta() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-2xl text-center shadow-xl before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gray-900"
          data-aos="zoom-y-out"
        >
          {/* Glow */}
          <div
            className="absolute bottom-0 left-1/2 -z-10 -translate-x-1/2 translate-y-1/2"
            aria-hidden="true"
          >
            <div className="h-56 w-[480px] rounded-full border-[20px] border-blue-500 blur-3xl" />
          </div>
          {/* Stripes illustration */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 transform"
            aria-hidden="true"
          >
            <Image
              className="max-w-none"
              src="/images/landing/stripes-dark.svg"
              width={768}
              height={432}
              alt="Stripes"
            />
          </div>
          <div className="px-4 py-12 md:px-12 md:py-20">
            <h2 className="mb-6 border-y text-3xl font-bold text-gray-200 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-700/.7),transparent)1] md:mb-12 md:text-4xl">
              Kezdd el ma, szerezd vissza az időd holnap
            </h2>
            <p className="mb-8 text-lg text-gray-400 md:text-xl">
              Csatlakozz 15 000+ diákunkhoz, akik már strukturált tanulással építik a jövőjüket
            </p>
            <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center sm:gap-4">
              <a
                className="btn group mb-4 w-full bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                href="/register"
              >
                <span className="relative inline-flex items-center">
                  Próbáld ki 7 napig ingyen{" "}
                  <span className="ml-1 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </a>
              <a
                className="btn group mb-4 w-full bg-white/10 text-white shadow-sm hover:bg-white/20 sm:mb-0 sm:w-auto"
                href="/courses"
              >
                <span className="relative inline-flex items-center">
                  Kurzusok megtekintése
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
