'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useLogout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  // Auth store
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const logout = useLogout()

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // Close mobile menu
  const closeMenu = () => {
    setIsOpen(false)
  }

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-50 w-full">
        <div
          className="relative"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)'
          }}
        >
          <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
            {/* Logo and Navigation Links */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <img
                  src="/navbar-icon.png"
                  alt="DMA Logo"
                  className="w-7 h-7 object-contain"
                />
                <span className="text-xl font-bold text-gray-900">
                  DMA
                </span>
              </Link>

              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/courses" className="text-gray-700 hover:text-gray-900 transition-colors duration-200">
                  Kurzusok
                </Link>
                <Link href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors duration-200">
                  Árazás
                </Link>
                <Link href="/blog" className="text-gray-700 hover:text-gray-900 transition-colors duration-200">
                  Blog
                </Link>
              </nav>
            </div>

            {/* Desktop Auth Button */}
            <div className="hidden md:flex items-center gap-2">
              {isLoading ? null : isAuthenticated && user ? (
                <Link href={user.role === 'INSTRUCTOR' ? '/instructor/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
                  >
                    Irányítópult
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
                  >
                    Bejelentkezés
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden fixed top-6 right-6 z-[1001] w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-all duration-300"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <span
          className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-2 bg-white' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2 bg-white' : ''
          }`}
        />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] md:hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(to bottom, #16222F 0%, #466C95 100%)',
          }}
        >
          <div className="flex flex-col items-center justify-center h-full px-6 py-20">
            {/* Logo */}
            <div className="mb-12">
              <Link href="/" onClick={closeMenu} className="flex items-center space-x-3">
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
                onClick={closeMenu}
                className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
              >
                Kurzusok
              </Link>
              <Link
                href="/pricing"
                onClick={closeMenu}
                className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
              >
                Árazás
              </Link>
              <Link
                href="/blog"
                onClick={closeMenu}
                className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
              >
                Blog
              </Link>
              {isAuthenticated && user && (
                <>
                  <Link
                    href={user.role === 'INSTRUCTOR' ? '/instructor/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                    onClick={closeMenu}
                    className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                  >
                    Irányítópult
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className="text-white text-2xl font-medium hover:text-white/80 transition-colors duration-200 py-3 px-6 inline-block min-h-[44px]"
                    >
                      Admin Felület
                    </Link>
                  )}
                  <Link
                    href="/account"
                    onClick={closeMenu}
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
                    closeMenu()
                  }}
                  size="lg"
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 px-8 py-6 text-lg font-medium transition-all duration-200 min-h-[44px]"
                >
                  Kijelentkezés
                </Button>
              ) : (
                <Link href="/login" onClick={closeMenu}>
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
      )}
    </>
  )
} 