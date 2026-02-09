import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Regisztráció',
  description: 'Regisztrálj a DMA Masterclass platformra és kezdd el a 7 napos ingyenes próbaidőszakot.',
  openGraph: {
    title: 'Regisztráció | DMA Masterclass',
    description: 'Regisztrálj és kezdd el a 7 napos ingyenes próbaidőszakot.',
    url: 'https://masterclass.dma.hu/regisztracio',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
