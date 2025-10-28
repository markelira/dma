'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Settings,
  FileText,
  Building,
  UserCheck,
  Calendar,
  BarChart3,
  School,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const menuItems = [
  {
    title: 'Áttekintés',
    href: '/university-admin/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: 'Kurzusok',
    href: '/university-admin/courses',
    icon: BookOpen,
    badge: null,
  },
  {
    title: 'Oktatók',
    href: '/university-admin/instructors',
    icon: UserCheck,
    badge: null,
  },
  {
    title: 'Hallgatók',
    href: '/university-admin/students',
    icon: GraduationCap,
    badge: null,
  },
  {
    title: 'Beiratkozások',
    href: '/university-admin/enrollments',
    icon: School,
    badge: null,
  },
  {
    title: 'Pénzügyek',
    href: '/university-admin/finance',
    icon: DollarSign,
    badge: null,
  },
  {
    title: 'Jelentések',
    href: '/university-admin/reports',
    icon: BarChart3,
    badge: null,
  },
  {
    title: 'Ütemezés',
    href: '/university-admin/schedule',
    icon: Calendar,
    badge: null,
  },
  {
    title: 'Egyetem Beállítások',
    href: '/university-admin/settings',
    icon: Settings,
    badge: null,
  },
];

export function UniversityAdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sikeres kijelentkezés');
    } catch (error) {
      toast.error('Hiba történt a kijelentkezés során');
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
        <Building className="h-8 w-8 text-blue-500 mr-2" />
        <span className="text-xl font-bold text-white">Egyetem Admin</span>
      </div>

      {/* University Info */}
      <div className="border-b border-gray-800 p-4">
        <div className="text-sm text-gray-400">Intézmény</div>
        <div className="text-white font-semibold">{user?.universityName || 'Egyetem Neve'}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-gray-800 p-4">
        <div className="mb-3">
          <p className="text-sm text-gray-400">Bejelentkezve mint</p>
          <p className="text-sm font-semibold text-white">{user?.displayName || user?.email}</p>
          <p className="text-xs text-blue-400">Egyetem Adminisztrátor</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-gray-800 text-white hover:bg-gray-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Kijelentkezés
        </Button>
      </div>
    </div>
  );
}