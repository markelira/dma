import * as React from 'react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="#" className="flex items-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white text-lg font-extrabold select-none font-inter">a</span>
        </Link>
        {/* Menu placeholder */}
        <nav className="hidden md:flex items-center space-x-4">
          {/* Menu items will go here */}
        </nav>
        {/* Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <Link href="#" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
            Bejelentkezés
          </Link>
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 h-9 rounded-md text-sm font-bold">
            Csatlakozzon ingyen
          </button>
        </div>
      </div>
    </header>
  );
};
