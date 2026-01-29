import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ReactQueryProvider } from "@/components/react-query-provider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth-provider'
import { CookieConsent } from '@/components/CookieConsent'
import { ConditionalAnalytics } from '@/components/ConditionalAnalytics'
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://masterclass.dma.hu'),
  title: {
    default: "DMA Masterclass – Struktúraépítő streaming platform",
    template: "%s | DMA Masterclass"
  },
  description: "Fedezz fel több mint 150 cégépítési tartalmat, hogy vállalkozásod végre strukturált és önjáró legyen. Zéró bullshit, csak azonnal alkalmazható és működő rendszerek.",
  keywords: [
    "online képzés",
    "vállalkozás fejlesztés",
    "cégépítés",
    "üzleti stratégia",
    "magyar vállalkozók",
    "masterclass",
    "streaming platform"
  ],
  authors: [{ name: "DMA Masterclass" }],
  creator: "DMA Masterclass",
  publisher: "DMA Masterclass",
  formatDetection: {
    email: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      hu: "/"
    }
  },
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "DMA Masterclass",
    title: "DMA Masterclass – Struktúraépítő streaming platform",
    description: "Fedezz fel több mint 150 cégépítési tartalmat, hogy vállalkozásod végre strukturált és önjáró legyen.",
    url: "https://masterclass.dma.hu",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DMA Masterclass",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DMA Masterclass – Struktúraépítő streaming platform",
    description: "Fedezz fel több mint 150 cégépítési tartalmat, hogy vállalkozásod végre strukturált és önjáró legyen.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DMA Masterclass",
    "url": "https://masterclass.dma.hu",
    "logo": "https://masterclass.dma.hu/logo.png",
    "description": "Struktúraépítő streaming platform vállalkozóknak",
    "sameAs": [
      "https://www.facebook.com/dmaakademia",
      "https://www.linkedin.com/company/dma-akademia"
    ]
  }

  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Google Analytics - loaded conditionally after cookie consent */}
        <ConditionalAnalytics />
      </head>
      <body className={`${inter.variable} bg-gray-50 font-sans tracking-tight text-gray-900 antialiased min-h-screen`}>
        <ErrorBoundary>
          <ReactQueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster position="bottom-right" />
            {/* GDPR Cookie Consent Banner */}
            <CookieConsent />
          </ReactQueryProvider>
        </ErrorBoundary>
        {/* Vercel Analytics for page views */}
        <Analytics />
      </body>
    </html>
  )
} 