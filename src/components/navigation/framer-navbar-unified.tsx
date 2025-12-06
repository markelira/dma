'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { CourseTypeDropdown } from './CourseTypeDropdown'
import { CategoryDropdown } from './CategoryDropdown'
import { CourseType } from '@/types'

interface FramerNavbarUnifiedProps {
  onMobileMenuToggle: () => void
  isMobileMenuOpen?: boolean
}

const SCROLL_THRESHOLD = 100

// Course type nav items configuration
const COURSE_TYPE_NAV_ITEMS: { type: CourseType; label: string; color: string; url: string }[] = [
  { type: 'WEBINAR', label: 'Webinárok', color: 'hover:text-purple-600', url: '/webinar' },
  { type: 'ACADEMIA', label: 'Akadémia', color: 'hover:text-blue-600', url: '/akademia' },
  { type: 'MASTERCLASS', label: 'Masterclass', color: 'hover:text-amber-600', url: '/masterclass' },
  { type: 'PODCAST', label: 'Podcast', color: 'hover:text-green-600', url: '/podcast' },
]

export function FramerNavbarUnified({ onMobileMenuToggle, isMobileMenuOpen = false }: FramerNavbarUnifiedProps) {
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const { isAuthenticated, user, isLoading } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleDropdownEnter = (id: string) => {
    setOpenDropdown(id)
  }

  const handleDropdownLeave = () => {
    setOpenDropdown(null)
  }

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
            maxWidth: scrolled ? '1000px' : '1400px',
            margin: '0 auto',
          }}
        >
          {/* Inner content with morphing background and height */}
          <div
            className="flex items-center justify-between transition-all duration-500 ease-in-out"
            style={{
              height: '64px',
              padding: scrolled ? '0 24px' : '0 32px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(117, 115, 114, 0.15)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Logo */}
            <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
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

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {/* Course Type Dropdowns */}
              {COURSE_TYPE_NAV_ITEMS.map(({ type, label, color, url }) => (
                <div
                  key={type}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(type)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    href={url}
                    className={`text-gray-700 ${color} font-bold font-inter transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/40 flex items-center gap-1`}
                    style={{
                      fontSize: scrolled ? '13px' : '14px',
                    }}
                  >
                    {label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === type ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>

                  <CourseTypeDropdown courseType={type} isOpen={openDropdown === type} />
                </div>
              ))}

              {/* Kategóriák Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('categories')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="text-gray-700 hover:text-gray-900 font-bold font-inter transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/40 flex items-center gap-1"
                  style={{
                    fontSize: scrolled ? '13px' : '14px',
                  }}
                >
                  Kategóriák
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'categories' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <CategoryDropdown isOpen={openDropdown === 'categories'} />
              </div>
            </div>

            {/* Desktop Auth Button */}
            <div className="hidden lg:flex items-center flex-shrink-0">
              {isLoading ? null : isAuthenticated && user ? (
                <Link href={user.role === 'INSTRUCTOR' ? '/instructor/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}>
                  <Button
                    size="sm"
                    className="bg-brand-secondary hover:bg-brand-secondary-hover text-white rounded-full font-medium font-inter transition-all duration-200"
                    style={{
                      padding: scrolled ? '8px 20px' : '10px 24px',
                      fontSize: scrolled ? '13px' : '14px',
                    }}
                  >
                    Irányítópult
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-brand-secondary hover:bg-brand-secondary-hover text-white rounded-full font-medium font-inter transition-all duration-200"
                    style={{
                      padding: scrolled ? '8px 20px' : '10px 24px',
                      fontSize: scrolled ? '13px' : '14px',
                    }}
                  >
                    Bejelentkezés
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button - Animates to X */}
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden w-11 h-11 flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="w-6 h-5 flex flex-col justify-between relative">
                <span
                  className={`block w-full h-0.5 bg-gray-900 rounded transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''
                  }`}
                />
                <span
                  className={`block w-full h-0.5 bg-gray-900 rounded transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                />
                <span
                  className={`block w-full h-0.5 bg-gray-900 rounded transition-all duration-300 origin-center ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
