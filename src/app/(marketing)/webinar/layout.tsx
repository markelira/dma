import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Webinárok',
  description: 'Élő és visszanézhető webinárok vállalkozóknak. Tanulj szakértőktől a legfontosabb üzleti témákban.',
  openGraph: {
    title: 'Webinárok | DMA Masterclass',
    description: 'Élő és visszanézhető webinárok vállalkozóknak a legfontosabb üzleti témákban.',
    url: 'https://masterclass.dma.hu/webinar',
  },
}

export default function WebinarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
