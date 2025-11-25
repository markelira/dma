import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createPortal } from 'react-dom'

interface StickyEnrollBarProps {
  ctaLabel: string
  onCtaClick: () => void
  loading?: boolean
  isPlus?: boolean
}

/**
 * StickyEnrollBar – mobilon a képernyő alján, desktopon a jobb alsó sarokban jelenik meg,
 * miután a felhasználó legalább 300 px-et görgetett.  
 * A komponens portálon keresztül kerül a <body>-ba, hogy ne korlátozza a szülő overflow-ja.
 */
export const StickyEnrollBar: React.FC<StickyEnrollBarProps> = ({ ctaLabel, onCtaClick, loading = false, isPlus }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset
      setVisible(y > 300)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  // Render via portal – SSR safeguard (window check)
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-50 sm:bottom-4 sm:inset-x-auto sm:right-4 sm:w-auto">
      <div className="mx-auto sm:mx-0 bg-white shadow-cardDeep rounded-full border flex items-center gap-3 px-4 py-2 sm:px-6">
        {process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTION === 'true' && isPlus && (
          <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-1">DMA Plus</span>
        )}
        <Button onClick={onCtaClick} loading={loading} className="px-6 py-2 text-base font-bold">
          {ctaLabel}
        </Button>
      </div>
    </div>,
    document.body
  )
} 