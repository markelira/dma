import Image from "next/image";

export default function LargeTestimonial() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--unframer-beige-10)] to-white py-24 md:py-32">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="space-y-6 text-center">
            <div className="relative inline-flex">
              <svg
                className="absolute -left-6 -top-2 -z-10"
                width={40}
                height={49}
                viewBox="0 0 40 49"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.7976 -0.000136375L39.9352 23.4746L33.4178 31.7234L13.7686 11.4275L22.7976 -0.000136375ZM9.34947 17.0206L26.4871 40.4953L19.9697 48.7441L0.320491 28.4482L9.34947 17.0206Z"
                  fill="#93C5FD"
                />
              </svg>
              <Image
                className="rounded-full ring-4 ring-white/50 shadow-xl"
                src="/images/landing/large-testimonial.jpg"
                width={64}
                height={64}
                alt="Large testimonial"
              />
            </div>
            <p className="text-2xl font-bold leading-relaxed text-gray-900 md:text-3xl">
              "A DMA Akadémia teljesen megváltoztatta, ahogy a vállalatom működik. A strukturált kurzusok{" "}
              <em className="italic text-blue-600">konkrét eredményeket</em> hoztak, nem csak elméletet."
            </p>
            <div className="text-sm font-medium text-gray-600">
              <span className="text-gray-900 font-semibold">Nagy Péter</span>{" "}
              <span className="text-gray-400">/</span>{" "}
              <span className="text-blue-600">Ügyvezető, TechStart Kft.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
