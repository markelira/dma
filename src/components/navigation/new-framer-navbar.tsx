'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useLogout'
import { Button } from '@/components/ui/button'

// Loading placeholder for navbar
const NavbarLoader = () => (
  <div className="h-[72px] w-full bg-white" />
)

// Dynamically import the new Framer navbar with SSR disabled
const AaveNavbar = dynamic(
  () => import('../../../framer/aave-s-navigation-bar').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: NavbarLoader }
)

export function NewFramerNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const logout = useLogout()

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

  // Get dashboard path based on user role
  const getDashboardPath = () => {
    if (!user?.role) return '/dashboard'
    switch (user.role) {
      case 'INSTRUCTOR':
        return '/instructor/dashboard'
      case 'ADMIN':
        return '/admin/dashboard'
      default:
        return '/dashboard'
    }
  }

  return (
    <>
      {/* CSS to hide the original aave logo and customize menu */}
      <style jsx global>{`
        /* Hide the aave logo SVG */
        .framer-w54dlk,
        [data-framer-name="aave logo"] {
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide the original "Bejelentkezés" button from Framer */
        .framer-DcI_RRqOp [data-framer-name="Button"] {
          display: none !important;
        }
      `}</style>

      {/* Fixed navbar container */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full">
        <div className="relative w-full">
          {/* Framer navbar - full width with custom props */}
          <div className="w-full framer-navbar-wrapper">
            <AaveNavbar
              // Menu titles
              title="Tartalmak"
              title2="Árazás"
              title3="Blog"
              // Hide menus 4 and 5
              showMenu4={false}
              showMenu5={false}
            />
          </div>

          {/* DMA Logo overlay - positioned over where aave logo was */}
          <Link
            href="/"
            className="absolute top-0 left-0 h-[72px] flex items-center pl-4 md:pl-6 z-20"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/images/navbar-logo.png"
                alt="DMA"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-gray-900">DMA</span>
            </div>
          </Link>

          {/* Auth buttons overlay - positioned on the right */}
          <div className="absolute top-0 right-0 h-[72px] hidden md:flex items-center gap-4 pr-4 md:pr-6 z-20">
            {!isLoading && (
              isAuthenticated && user ? (
                <Link href={getDashboardPath()}>
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium px-6 py-2"
                  >
                    Irányítópult
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium px-6 py-2"
                  >
                    Bejelentkezés
                  </Button>
                </Link>
              )
            )}
          </div>

          {/* Mobile hamburger button overlay */}
          <button
            onClick={toggleMobileMenu}
            className="absolute top-4 right-4 md:hidden w-10 h-10 flex items-center justify-center z-20"
            aria-label="Open menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span className="block w-full h-0.5 bg-gray-900 rounded transition-all duration-300" />
              <span className="block w-full h-0.5 bg-gray-900 rounded transition-all duration-300" />
              <span className="block w-full h-0.5 bg-gray-900 rounded transition-all duration-300" />
            </div>
          </button>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-[72px]" />

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
                  <Image
                    src="/images/navbar-logo.png"
                    alt="DMA Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-3xl font-bold text-white">
                    DMA
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col items-center space-y-6 mb-12">
                {/* Tartalmak Links */}
                <div className="text-center space-y-3">
                  <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Tartalmak</p>
                  <Link
                    href="/webinar"
                    onClick={closeMobileMenu}
                    className="block text-white text-lg font-medium hover:text-white/80 transition-colors duration-200 py-2 px-6 min-h-[44px]"
                  >
                    Webinárok
                  </Link>
                  <Link
                    href="/akademia"
                    onClick={closeMobileMenu}
                    className="block text-white text-lg font-medium hover:text-white/80 transition-colors duration-200 py-2 px-6 min-h-[44px]"
                  >
                    Akadémia
                  </Link>
                  <Link
                    href="/masterclass"
                    onClick={closeMobileMenu}
                    className="block text-white text-lg font-medium hover:text-white/80 transition-colors duration-200 py-2 px-6 min-h-[44px]"
                  >
                    Masterclass
                  </Link>
                </div>
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
                      href={getDashboardPath()}
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
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-sm font-medium transition-all duration-200 min-h-[44px]"
                  >
                    Kijelentkezés
                  </Button>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu}>
                    <Button
                      size="lg"
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-sm font-medium transition-all duration-200 min-h-[44px]"
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
