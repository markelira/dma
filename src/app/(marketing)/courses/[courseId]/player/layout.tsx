'use client'

import React, { useEffect } from 'react'

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Player layout - full screen without navbar/footer
  
  useEffect(() => {
    // More aggressive approach to hide navbar and reset layout
    // Find and hide the navbar
    const navbar = document.querySelector('nav')
    const footer = document.querySelector('footer')
    const mainLayout = document.querySelector('.pt-\\[74px\\]')
    
    if (navbar) {
      navbar.style.display = 'none'
    }
    if (footer) {
      footer.style.display = 'none'
    }
    if (mainLayout) {
      mainLayout.classList.remove('pt-[74px]')
      mainLayout.style.paddingTop = '0'
    }
    
    // Clean up on unmount
    return () => {
      if (navbar) {
        navbar.style.display = ''
      }
      if (footer) {
        footer.style.display = ''
      }
      if (mainLayout) {
        mainLayout.classList.add('pt-[74px]')
        mainLayout.style.paddingTop = ''
      }
    }
  }, [])
  
  return (
    <>
      <style jsx global>{`
        /* Hide navbar and footer in player mode */
        nav { display: none !important; }
        footer { display: none !important; }
        /* Reset body padding from marketing layout */
        .pt-\\[74px\\] { padding-top: 0 !important; }
        /* Prevent body scroll but allow internal scrolling */
        html {
          overflow: hidden;
          height: 100%;
        }
        body {
          overflow: hidden;
          height: 100%;
          margin: 0;
        }
      `}</style>
      <div className="h-[100dvh] bg-white relative z-50">
        {children}
      </div>
    </>
  )
}