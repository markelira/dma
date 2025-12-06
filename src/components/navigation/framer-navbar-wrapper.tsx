'use client'

import React, { useState, useEffect } from 'react'
import { FramerNavbarUnified } from './framer-navbar-unified'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/hooks/useLogout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FramerNavbarWrapper() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
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

  return (
    <>
      {/* Unified morphing navbar */}
      <FramerNavbarUnified onMobileMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Mobile Menu Dropdown - Compact panel below navbar */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-[9998] lg:hidden bg-black/20"
            onClick={closeMobileMenu}
          />

          {/* Dropdown Panel - positioned below navbar */}
          <div className="fixed top-20 left-4 right-4 z-[9999] lg:hidden mt-2">
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto"
            >
              {/* Navigation Links */}
              <nav className="p-2">
                {/* Course Type Links */}
                <Link
                  href="/webinar"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors min-h-[48px]"
                >
                  Webinárok
                </Link>
                <Link
                  href="/akademia"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors min-h-[48px]"
                >
                  Akadémia
                </Link>
                <Link
                  href="/masterclass"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-colors min-h-[48px]"
                >
                  Masterclass
                </Link>
                <Link
                  href="/podcast"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors min-h-[48px]"
                >
                  Podcast
                </Link>

                {/* Divider */}
                <div className="h-px bg-gray-100 my-2 mx-4" />

                {/* Secondary Links */}
                <Link
                  href="/courses"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                >
                  Kategóriák
                </Link>
                <Link
                  href="/pricing"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                >
                  Árazás
                </Link>
                <Link
                  href="/blog"
                  onClick={closeMobileMenu}
                  className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                >
                  Blog
                </Link>

                {/* User Links (if authenticated) */}
                {isAuthenticated && user && (
                  <>
                    <div className="h-px bg-gray-100 my-2 mx-4" />
                    <Link
                      href={user.role === 'INSTRUCTOR' ? '/instructor/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                    >
                      Irányítópult
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                      >
                        Admin Felület
                      </Link>
                    )}
                    <Link
                      href="/account"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                    >
                      Fiókom
                    </Link>
                  </>
                )}
              </nav>

              {/* Auth Button */}
              <div className="p-3 pt-0">
                {isAuthenticated && user ? (
                  <Button
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium min-h-[48px]"
                  >
                    Kijelentkezés
                  </Button>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu} className="block">
                    <Button
                      className="w-full bg-[#E72B36] hover:bg-[#d42530] text-white py-3 rounded-xl font-medium min-h-[48px]"
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
