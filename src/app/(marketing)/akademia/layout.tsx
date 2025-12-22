import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Akadémia',
  description: 'Ismerd meg a DMA Akadémia képzéseit. Strukturált tananyagok vállalkozóknak a cégépítés minden területéről.',
  openGraph: {
    title: 'Akadémia | DMA Masterclass',
    description: 'Strukturált tananyagok vállalkozóknak a cégépítés minden területéről.',
    url: 'https://masterclass.dma.hu/akademia',
  },
}

export default function AkademiaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
