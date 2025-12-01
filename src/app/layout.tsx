import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ReactQueryProvider } from "@/components/react-query-provider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from 'sonner'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth-provider'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "DMA Masterclass – Struktúraépítő streaming platform",
  description: "Fedezz fel a több mint 150 cégépítési tartalmat, hogy vállalkozásod végre strukturált és önjáró legyen. Zéró bullshit, csak azonnal alkalmazható és működő rendszerek.",
  keywords: [
    "online képzés",
    "magyar egyetemek",
    "elismert bizonyítvány",
    "karrier fejlesztés"
  ],
  alternates: {
    canonical: "/",
    languages: {
      hu: "/"
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config','${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname });`}
      </Script>
      <body className={`${inter.variable} bg-gray-50 font-sans tracking-tight text-gray-900 antialiased min-h-screen`}>
        <ErrorBoundary>
          <ReactQueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster position="bottom-right" />
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
} 