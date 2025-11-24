'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  BarChart,
  Settings,
  School,
  FileText,
  DollarSign,
  Shield,
  Building
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Műszerfal',
    href: '/dashboard',
    icon: Home,
    roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  },
  {
    label: 'Beiratkozásaim',
    href: '/dashboard/courses',
    icon: BookOpen,
    roles: [UserRole.STUDENT]
  },
  {
    label: 'Tartalom kezelés',
    href: '/instructor/courses',
    icon: BookOpen,
    roles: [UserRole.INSTRUCTOR]
  },
  {
    label: 'Diákok',
    href: '/instructor/students',
    icon: Users,
    roles: [UserRole.INSTRUCTOR]
  },
  {
    label: 'Analitika',
    href: '/instructor/analytics',
    icon: BarChart,
    roles: [UserRole.INSTRUCTOR]
  },
  {
    label: 'Felhasználók',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Tartalmak',
    href: '/admin/courses',
    icon: BookOpen,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Egyetemek',
    href: '/admin/universities',
    icon: Building,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Pénzügyek',
    href: '/admin/finance',
    icon: DollarSign,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Biztonság',
    href: '/admin/security',
    icon: Shield,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Egyetem kezelés',
    href: '/university/manage',
    icon: School,
    roles: [UserRole.UNIVERSITY_ADMIN]
  },
  {
    label: 'Jelentések',
    href: '/university/reports',
    icon: FileText,
    roles: [UserRole.UNIVERSITY_ADMIN]
  },
  {
    label: 'Beállítások',
    href: '/dashboard/settings',
    icon: Settings,
    roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  }
];

export function RoleBasedNav() {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  const visibleItems = navItems.filter(item => hasRole(item.roles));

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors"
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}