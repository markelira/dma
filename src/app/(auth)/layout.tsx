export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="absolute z-30 w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Site branding */}
            <div className="mr-4 shrink-0">
              <Link href="/" className="inline-flex" aria-label="DMA">
                <Image
                  src="/images/DMA.hu-logo.png"
                  alt="DMA Logo"
                  width={50}
                  height={18}
                  className="h-4 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex grow">
        {/* Background gradient - centered */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-brand-secondary/50 opacity-70 blur-[160px]"></div>
        </div>

        {/* Centered Content */}
        <div className="w-full">
          <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1 md:before:min-h-[5rem]">
            <div className="px-4 sm:px-6">
              <div className="mx-auto w-full max-w-lg">
                <div className="py-16 md:py-20">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
