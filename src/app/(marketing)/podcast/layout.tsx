import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Podcast',
  description: 'Hallgasd a DMA Podcast epizódokat. Inspiráló beszélgetések sikeres vállalkozókkal és szakértőkkel.',
  openGraph: {
    title: 'Podcast | DMA Masterclass',
    description: 'Inspiráló beszélgetések sikeres vállalkozókkal és szakértőkkel.',
    url: 'https://masterclass.dma.hu/podcast',
  },
}

export default function PodcastLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
