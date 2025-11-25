'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

interface FramerNavbarUnifiedProps {
  onMobileMenuToggle: () => void
}

const SCROLL_THRESHOLD = 100

export function FramerNavbarUnified({ onMobileMenuToggle }: FramerNavbarUnifiedProps) {
  const [scrolled, setScrolled] = useState(false)
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false)
  const { isAuthenticated, user, isLoading } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <nav
        className="w-full transition-all duration-500 ease-in-out"
        style={{
          padding: scrolled ? '16px 24px' : '16px 48px',
        }}
      >
        {/* Container that morphs from full-width to centered pill */}
        <div
          className="transition-all duration-500 ease-in-out"
          style={{
            maxWidth: scrolled ? '1024px' : '100%',
            margin: '0 auto',
          }}
        >
          {/* Inner content with morphing background and height */}
          <div
            className="flex items-center justify-between transition-all duration-500 ease-in-out"
            style={{
              height: scrolled ? '64px' : '64px',
              padding: scrolled ? '0 32px' : '0',
              borderRadius: scrolled ? '40px' : '0px',
              backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0)',
              backdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
              WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
              border: scrolled ? '1px solid rgba(117, 115, 114, 0.15)' : '1px solid transparent',
              boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/images/DMA.hu-logo.png"
                alt="DMA Logo"
                className="transition-all duration-500"
                style={{
                  height: scrolled ? '14px' : '17px',
                  width: 'auto',
                }}
              />
            </Link>

            {/* Desktop Navigation - Centered when not scrolled */}
            <div
              className="hidden md:flex items-center gap-8 transition-all duration-500"
              style={{
                position: scrolled ? 'static' : 'absolute',
                left: scrolled ? 'auto' : '50%',
                transform: scrolled ? 'none' : 'translateX(-50%)',
              }}
            >
              {/* Tartalmak Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCoursesDropdownOpen(true)}
                onMouseLeave={() => setCoursesDropdownOpen(false)}
              >
                <button
                  className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/20 flex items-center gap-1"
                  style={{
                    fontSize: scrolled ? '14px' : '16px',
                  }}
                >
                  Tartalmak
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${coursesDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {coursesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    <Link
                      href="/webinar"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600">🎥</span>
                        <span>Webinárok</span>
                      </div>
                    </Link>
                    <Link
                      href="/akadémia"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-secondary/5 hover:text-brand-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-brand-secondary">📚</span>
                        <span>Akadémia</span>
                      </div>
                    </Link>
                    <Link
                      href="/masterclass"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600">🎓</span>
                        <span>Masterclass</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/20"
                style={{
                  fontSize: scrolled ? '14px' : '16px',
                }}
              >
                Árazás
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/20"
                style={{
                  fontSize: scrolled ? '14px' : '16px',
                }}
              >
                Blog
              </Link>
            </div>

            {/* Desktop Auth Button */}
            <div className="hidden md:flex items-center">
              {isLoading ? null : isAuthenticated && user ? (
                <Link href={user.role === 'INSTRUCTOR' ? '/instructor/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}>
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all duration-200"
                    style={{
                      padding: scrolled ? '8px 20px' : '10px 24px',
                      fontSize: scrolled ? '14px' : '16px',
                    }}
                  >
                    Irányítópult
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all duration-200"
                    style={{
                      padding: scrolled ? '8px 20px' : '10px 24px',
                      fontSize: scrolled ? '14px' : '16px',
                    }}
                  >
                    Bejelentkezés
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden w-10 h-10 flex items-center justify-center"
              aria-label="Open menu"
            >
              <div className="w-6 flex flex-col gap-1.5">
                <span className="block w-full h-0.5 bg-gray-900 rounded transition-all duration-300" />
                <span className="block w-full h-0.5 bg-gray-900 rounded transition-all duration-300" />
                <span className="block w-full h-0.5 bg-gray-900 rounded transition-all duration-300" />
              </div>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
