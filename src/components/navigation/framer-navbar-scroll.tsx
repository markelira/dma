'use client'

import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

interface FramerNavbarScrollProps {
  onMobileMenuToggle: () => void
}

export function FramerNavbarScroll({ onMobileMenuToggle }: FramerNavbarScrollProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  return (
    <header className="w-full">
      <nav className="w-full py-4 px-6">
        {/* Centered container with narrower max-width */}
        <div className="mx-auto max-w-4xl">
          {/* Rounded pill with glassmorphism - taller height */}
          <div
            className="flex items-center justify-between h-16 px-8 rounded-[40px] transition-all duration-300 shadow-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(117, 115, 114, 0.15)',
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/navbar-icon.png"
                alt="DMA Logo"
                className="w-5 h-5 object-contain"
              />
              <span className="text-lg font-semibold text-gray-900">
                DMA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/courses"
                className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/40 hover:border hover:border-gray-300/20"
              >
                Tartalmak
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/40 hover:border hover:border-gray-300/20"
              >
                Árazás
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-full hover:bg-white/40 hover:border hover:border-gray-300/20"
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
                    className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 text-sm rounded-full font-medium transition-all duration-200"
                  >
                    Irányítópult
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 text-sm rounded-full font-medium transition-all duration-200"
                  >
                    Bejelentkezés
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden w-9 h-9 flex items-center justify-center"
              aria-label="Open menu"
            >
              <div className="w-5 flex flex-col gap-1">
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
