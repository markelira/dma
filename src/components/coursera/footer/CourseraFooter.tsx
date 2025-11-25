'use client';

import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Youtube, Instagram } from 'lucide-react';

const footerLinks = {
  coursera: [
    { label: 'About', href: '/about' },
    { label: 'What We Offer', href: '/what-we-offer' },
    { label: 'Careers', href: '/careers' },
    { label: 'Catalog', href: '/catalog' },
    { label: 'Coursera Plus', href: '/coursera-plus' },
    { label: 'Professional Certificates', href: '/certificates' },
    { label: 'For Enterprise', href: '/enterprise' },
    { label: 'Become a Partner', href: '/partners' },
  ],
  community: [
    { label: 'Learners', href: '/learners' },
    { label: 'Partners', href: '/partners' },
    { label: 'Developers', href: '/developers' },
    { label: 'Beta Testers', href: '/beta' },
    { label: 'Translators', href: '/translators' },
    { label: 'Blog', href: '/blog' },
    { label: 'Tech Blog', href: '/tech-blog' },
    { label: 'Teaching Center', href: '/teaching' },
  ],
  more: [
    { label: 'Press', href: '/press' },
    { label: 'Investors', href: '/investors' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Help', href: '/help' },
    { label: 'Accessibility', href: '/accessibility' },
    { label: 'Contact', href: '/contact' },
    { label: 'Articles', href: '/articles' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export function CourseraFooter() {
  return (
    <footer className="bg-white border-t border-coursera-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Coursera Column */}
          <div>
            <h3 className="font-bold text-coursera-text-primary mb-4">
              Coursera
            </h3>
            <ul className="space-y-2">
              {footerLinks.coursera.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-coursera-text-secondary hover:text-coursera-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h3 className="font-bold text-coursera-text-primary mb-4">
              Community
            </h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-coursera-text-secondary hover:text-coursera-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Column */}
          <div>
            <h3 className="font-bold text-coursera-text-primary mb-4">
              More
            </h3>
            <ul className="space-y-2">
              {footerLinks.more.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-coursera-text-secondary hover:text-coursera-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile App Column */}
          <div>
            <h3 className="font-bold text-coursera-text-primary mb-4">
              Mobile
            </h3>
            <p className="text-sm text-coursera-text-secondary mb-4">
              Download the Coursera mobile app
            </p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-black text-white rounded text-sm">
                App Store
              </button>
              <button className="px-4 py-2 bg-black text-white rounded text-sm">
                Google Play
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-coursera-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-coursera-blue rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-sm text-coursera-text-secondary">
                © 2025 Coursera Inc. All rights reserved.
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-coursera-text-secondary">Language:</span>
                <select className="text-sm border border-coursera-border rounded px-2 py-1">
                  <option>English</option>
                  <option>Español</option>
                  <option>Français</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className="text-coursera-text-secondary hover:text-coursera-blue transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

