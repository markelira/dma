import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bejelentkezés',
  description: 'Jelentkezz be a DMA Masterclass fiókodba és folytasd a tanulást.',
  openGraph: {
    title: 'Bejelentkezés | DMA Masterclass',
    description: 'Jelentkezz be a DMA Masterclass fiókodba.',
    url: 'https://masterclass.dma.hu/login',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
