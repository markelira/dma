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
    <header className="w-full">
      <nav className="w-full py-4 px-6 lg:px-12">
        {/* Full-width flex container - no rounded pill */}
        <div className="flex items-center justify-between h-16 transition-all duration-300">
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

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
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
                  className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200"
                >
                  Irányítópult
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-200"
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
      </nav>
    </header>
  )
}
