import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Árak',
  description: 'Fedezd fel a DMA Masterclass előfizetési csomagokat. 7 napos ingyenes próbaidőszak, 150+ struktúraépítő tartalom, bármikor lemondható.',
  openGraph: {
    title: 'Árak | DMA Masterclass',
    description: 'Fedezd fel a DMA Masterclass előfizetési csomagokat. 7 napos ingyenes próbaidőszak.',
    url: 'https://masterclass.dma.hu/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
