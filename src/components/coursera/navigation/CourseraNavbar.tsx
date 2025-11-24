'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, X, ChevronDown } from 'lucide-react';

export function CourseraNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Explore', hasDropdown: true },
    { label: 'For Business', hasDropdown: true },
    { label: 'For Universities', hasDropdown: true },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-200 ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-coursera-blue rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-coursera-text-primary">
                Coursera
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center px-4 py-2 text-sm font-medium text-coursera-text-primary hover:text-coursera-blue transition-colors">
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </button>
                {link.hasDropdown && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-coursera-border py-2">
                    <Link
                      href="#"
                      className="block px-4 py-2 text-sm text-coursera-text-primary hover:bg-coursera-bg-light"
                    >
                      Browse Courses
                    </Link>
                    <Link
                      href="#"
                      className="block px-4 py-2 text-sm text-coursera-text-primary hover:bg-coursera-bg-light"
                    >
                      Browse Certificates
                    </Link>
                    <Link
                      href="#"
                      className="block px-4 py-2 text-sm text-coursera-text-primary hover:bg-coursera-bg-light"
                    >
                      Browse Degrees
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div
              className={`relative w-full transition-all duration-300 ${
                isSearchExpanded ? 'max-w-lg' : 'max-w-md'
              }`}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-coursera-text-secondary" />
                <input
                  type="text"
                  placeholder="What do you want to learn?"
                  className="w-full pl-10 pr-4 py-2 border border-coursera-border rounded-md focus:outline-none focus:ring-2 focus:ring-coursera-blue focus:border-transparent text-sm"
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => setIsSearchExpanded(false)}
                />
              </div>
            </div>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-coursera-text-primary hover:text-coursera-blue transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-coursera-blue rounded-md hover:bg-coursera-blue-hover transition-colors"
            >
              Join for Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-coursera-text-primary" />
            ) : (
              <Menu className="h-6 w-6 text-coursera-text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-coursera-text-secondary" />
            <input
              type="text"
              placeholder="What do you want to learn?"
              className="w-full pl-10 pr-4 py-2 border border-coursera-border rounded-md focus:outline-none focus:ring-2 focus:ring-coursera-blue focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-coursera-border py-4">
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href="#"
                  className="block px-4 py-2 text-sm font-medium text-coursera-text-primary hover:bg-coursera-bg-light rounded-md"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-coursera-border space-y-2">
                <Link
                  href="/login"
                  className="block px-4 py-2 text-sm font-medium text-coursera-text-primary hover:bg-coursera-bg-light rounded-md"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-sm font-semibold text-white bg-coursera-blue rounded-md hover:bg-coursera-blue-hover text-center"
                >
                  Join for Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

