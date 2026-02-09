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
          <div className="fixed top-16 left-4 right-4 z-[9999] lg:hidden mt-3">
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto"
            >
              {/* Navigation Links */}
              <nav className="p-2">
                {/* Authenticated Users - Dashboard Links */}
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Kezdőlap
                    </Link>
                    <Link
                      href="/dashboard/webinar"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Webinár
                    </Link>
                    <Link
                      href="/dashboard/academia"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Akadémia
                    </Link>
                    <Link
                      href="/dashboard/masterclass"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Masterclass
                    </Link>
                    <Link
                      href="/dashboard/podcast"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Podcast
                    </Link>
                    {/* Demo Call Section */}
                    <div className="h-px bg-gray-100 my-2 mx-4" />
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Foglalj demo hívást
                    </div>
                    <a
                      href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0WDMeHgQ6wnoSeA4BwFB_d7HZmY7MH5LKDh34jFBub-e_IS-P80UwEt45pIhZivl5Teqohq4fW"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Több mint 10 munkatársam van
                    </a>
                    <a
                      href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0HsL5YiflB-dp9Uws8SJi8MLV20PtubjFtSuhefRwXtjTbW-ABbBl7DPenQ5_I_YFjv7DHaanq"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Kevesebb mint 10 munkatársam van
                    </a>
                  </>
                ) : (
                  <>
                    {/* Non-authenticated Users - Marketing Links */}
                    <Link
                      href="/webinar"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Webinár
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
                      Területek
                    </Link>
                    {/* Demo Call Section */}
                    <div className="h-px bg-gray-100 my-2 mx-4" />
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Foglalj demo hívást
                    </div>
                    <a
                      href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0WDMeHgQ6wnoSeA4BwFB_d7HZmY7MH5LKDh34jFBub-e_IS-P80UwEt45pIhZivl5Teqohq4fW"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Több mint 10 munkatársam van
                    </a>
                    <a
                      href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0HsL5YiflB-dp9Uws8SJi8MLV20PtubjFtSuhefRwXtjTbW-ABbBl7DPenQ5_I_YFjv7DHaanq"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-900 font-semibold hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors min-h-[48px]"
                    >
                      Kevesebb mint 10 munkatársam van
                    </a>
                  </>
                )}

                {/* User Links (if authenticated) - Admin only */}
                {isAuthenticated && user && user.role === 'ADMIN' && (
                  <>
                    <div className="h-px bg-gray-100 my-2 mx-4" />
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors min-h-[48px]"
                    >
                      Admin Felület
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
                  <Link href="/bejelentkezes" onClick={closeMobileMenu} className="block">
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
