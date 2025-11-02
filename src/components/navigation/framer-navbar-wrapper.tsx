'use client'

import React, { useState, useEffect } from 'react'
import { FramerNavbarInitial } from './framer-navbar-initial'
import { FramerNavbarScroll } from './framer-navbar-scroll'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useLogout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const SCROLL_THRESHOLD = 100 // pixels

export function FramerNavbarWrapper() {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const logout = useLogout()

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setScrolled(scrollPosition > SCROLL_THRESHOLD)
    }

    // Set initial state
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Initial Navbar - Hidden when scrolled */}
      <div
        className="transition-all duration-300"
        style={{
          opacity: scrolled ? 0 : 1,
          pointerEvents: scrolled ? 'none' : 'auto',
          transform: scrolled ? 'translateY(-20px)' : 'translateY(0)',
        }}
      >
        <FramerNavbarInitial onMobileMenuToggle={toggleMobileMenu} />
      </div>

      {/* Scroll Navbar - Shown when scrolled */}
      <div
        className="transition-all duration-300"
        style={{
          opacity: scrolled ? 1 : 0,
          pointerEvents: scrolled ? 'auto' : 'none',
          transform: scrolled ? 'translateY(0)' : 'translateY(-20px)',
        }}
      >
        <FramerNavbarScroll onMobileMenuToggle={toggleMobileMenu} />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Close button */}
          <button
            onClick={closeMobileMenu}
            className="fixed top-6 right-6 z-[1002] w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 md:hidden"
            aria-label="Close menu"
          >
            <span className="block w-6 h-0.5 bg-white rounded rotate-45 translate-y-2" />
            <span className="block w-6 h-0.5 bg-white rounded opacity-0" />
            <span className="block w-6 h-0.5 bg-white rounded -rotate-45 -translate-y-2" />
          </button>

          {/* Overlay */}
          <div
            className="fixed inset-0 z-[1001] md:hidden transition-all duration-300"
            style={{
              background: 'linear-gradient(to bottom, #16222F 0%, #466C95 100%)',
            }}
          >
            <div className="flex flex-col items-center justify-center h-full px-6 py-20">
              {/* Logo */}
              <div className="mb-12">
                <Link href="/" onClick={closeMobileMenu} className="flex items-center space-x-3">
                  <img
                    src="/navbar-icon.png"
                    alt="DMA Logo"
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-3xl font-bold text-white">
                    DMA
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col items-center space-y-6 mb-12">
                <Link
                  href="/courses"
                  onClick={closeMobileMenu}
                  className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                >
                  Kurzusok
                </Link>
                <Link
                  href="/pricing"
                  onClick={closeMobileMenu}
                  className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                >
                  Árazás
                </Link>
                <Link
                  href="/blog"
                  onClick={closeMobileMenu}
                  className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                >
                  Blog
                </Link>
                {isAuthenticated && user && (
                  <>
                    <Link
                      href={user.role === 'INSTRUCTOR' ? '/instructor/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                      onClick={closeMobileMenu}
                      className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                    >
                      Irányítópult
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                      >
                        Admin Felület
                      </Link>
                    )}
                    <Link
                      href="/account"
                      onClick={closeMobileMenu}
                      className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                    >
                      Fiókom
                    </Link>
                  </>
                )}
              </nav>

              {/* Auth Button */}
              <div className="w-full max-w-xs">
                {isAuthenticated && user ? (
                  <Button
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }}
                    size="lg"
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-lg font-medium transition-all duration-200 min-h-[44px]"
                  >
                    Kijelentkezés
                  </Button>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu}>
                    <Button
                      size="lg"
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-lg font-medium transition-all duration-200 min-h-[44px]"
                    >
                      Bejelentkezés
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
