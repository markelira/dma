'use client'

import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

interface FramerNavbarInitialProps {
  onMobileMenuToggle: () => void
}

export function FramerNavbarInitial({ onMobileMenuToggle }: FramerNavbarInitialProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <nav className="w-full py-6 px-6 lg:px-12">
        <div className="container mx-auto">
          {/* Content wrapper with rounded corners and transparent background */}
          <div
            className="flex items-center justify-between h-16 px-6 rounded-[40px] transition-all duration-300"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0)',
              border: '1px solid rgba(117, 115, 114, 0)',
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/navbar-icon.png"
                alt="DMA Logo"
                className="w-6 h-6 object-contain"
              />
              <span className="text-xl font-semibold text-gray-900">
                DMA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/courses"
                className="text-gray-700 hover:text-gray-900 text-base font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/20"
              >
                Kurzusok
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-gray-900 text-base font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/20"
              >
                Árazás
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 hover:text-gray-900 text-base font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/20"
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
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Irányítópult
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-md"
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
