import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masterclass',
  description: 'Prémium masterclass képzések sikeres vállalkozóktól. Mélyreható tudás a legfontosabb üzleti területekről.',
  openGraph: {
    title: 'Masterclass | DMA Masterclass',
    description: 'Prémium masterclass képzések sikeres vállalkozóktól.',
    url: 'https://masterclass.dma.hu/masterclass',
  },
}

export default function MasterclassLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
