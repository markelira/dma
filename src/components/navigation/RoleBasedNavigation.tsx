'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import {
  User,
  Settings,
  Shield,
  BookOpen,
  Users,
  BarChart3,
  Building2,
  GraduationCap,
  FileText,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: UserRole[];
  permission?: {
    resource: string;
    action: string;
  };
  children?: NavigationItem[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Irányítópult',
    href: '/dashboard',
    icon: <BarChart3 className="w-4 h-4" />,
    roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN]
  },
  {
    label: 'Tartalmak',
    href: '/courses',
    icon: <BookOpen className="w-4 h-4" />,
    children: [
      {
        label: 'Összes tartalom',
        href: '/courses',
        roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN]
      },
      {
        label: 'Új tartalom létrehozása',
        href: '/courses/create',
        roles: [UserRole.INSTRUCTOR, UserRole.ADMIN],
        permission: {
          resource: 'courses',
          action: 'create'
        }
      },
      {
        label: 'Saját tartalmaim',
        href: '/instructor/courses',
        roles: [UserRole.INSTRUCTOR, UserRole.ADMIN]
      },
      {
        label: 'Tartalom jóváhagyás',
        href: '/university-admin/courses/approval',
        roles: [UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN]
      }
    ]
  },
  {
    label: 'Felhasználók',
    href: '/users',
    icon: <Users className="w-4 h-4" />,
    roles: [UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN],
    children: [
      {
        label: 'Felhasználók kezelése',
        href: '/admin/users',
        roles: [UserRole.ADMIN]
      },
      {
        label: 'Oktatók kezelése',
        href: '/university-admin/instructors',
        roles: [UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN]
      },
      {
        label: 'Hallgatók kezelése',
        href: '/university-admin/students',
        roles: [UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN]
      },
      {
        label: 'Szerepkörök',
        href: '/admin/roles',
        roles: [UserRole.ADMIN]
      }
    ]
  },
  {
    label: 'Egyetemek',
    href: '/universities',
    icon: <Building2 className="w-4 h-4" />,
    roles: [UserRole.ADMIN],
    children: [
      {
        label: 'Egyetemek kezelése',
        href: '/admin/universities',
        roles: [UserRole.ADMIN]
      },
      {
        label: 'Tanszékek',
        href: '/admin/departments',
        roles: [UserRole.ADMIN]
      }
    ]
  },
  {
    label: 'Kategóriák',
    href: '/categories',
    icon: <FileText className="w-4 h-4" />,
    roles: [UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN],
    children: [
      {
        label: 'Kategóriák kezelése',
        href: '/admin/categories',
        roles: [UserRole.UNIVERSITY_ADMIN, UserRole.ADMIN]
      }
    ]
  },
  {
    label: 'Rendszer',
    href: '/admin',
    icon: <Shield className="w-4 h-4" />,
    roles: [UserRole.ADMIN],
    children: [
      {
        label: 'Rendszerbeállítások',
        href: '/admin/settings',
        roles: [UserRole.ADMIN]
      },
      {
        label: 'Biztonsági napló',
        href: '/admin/audit-log',
        roles: [UserRole.ADMIN]
      },
      {
        label: 'Analitika',
        href: '/admin/analytics',
        roles: [UserRole.ADMIN]
      },
      {
        label: 'Fájlfeltöltés',
        href: '/admin/tools/file-upload',
        roles: [UserRole.ADMIN]
      }
    ]
  }
];

interface RoleBasedNavigationProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showUserMenu?: boolean;
}

export function RoleBasedNavigation({ 
  className,
  variant = 'horizontal',
  showUserMenu = true 
}: RoleBasedNavigationProps) {
  const { user, hasPermission, hasRole, logout } = useAuth();
  const pathname = usePathname();

  // Filter navigation items based on user role and permissions
  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    if (!user) return [];

    return items.filter(item => {
      // Check role requirement
      if (item.roles && !item.roles.some(role => hasRole(role))) {
        return false;
      }

      // Check permission requirement
      if (item.permission && !hasPermission(item.permission.resource, item.permission.action)) {
        return false;
      }

      // Filter children if they exist
      if (item.children) {
        item.children = filterNavigationItems(item.children);
        // Keep parent if it has valid children or if parent itself is accessible
        return item.children.length > 0 || !item.roles || item.roles.some(role => hasRole(role));
      }

      return true;
    });
  };

  const visibleItems = filterNavigationItems(navigationItems);

  // Check if current path matches navigation item
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  // Get role badge
  const getRoleBadge = () => {
    if (!user || !user.role) return null;

    const roleLabels = {
      [UserRole.STUDENT]: 'Hallgató',
      [UserRole.INSTRUCTOR]: 'Oktató',
      [UserRole.UNIVERSITY_ADMIN]: 'Egyetemi Admin',
      [UserRole.ADMIN]: 'Rendszer Admin'
    };

    const roleColors = {
      [UserRole.STUDENT]: 'bg-blue-100 text-blue-800',
      [UserRole.INSTRUCTOR]: 'bg-green-100 text-green-800',
      [UserRole.UNIVERSITY_ADMIN]: 'bg-purple-100 text-purple-800',
      [UserRole.ADMIN]: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={cn('text-xs', roleColors[user.role])}>
        {roleLabels[user.role]}
      </Badge>
    );
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  if (variant === 'vertical') {
    return (
      <nav className={cn('space-y-2', className)}>
        {visibleItems.map((item) => (
          <div key={item.href}>
            {item.children ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.href} asChild>
                      <Link href={child.href} className="w-full">
                        {child.icon}
                        <span className="ml-2">{child.label}</span>
                        {child.badge && (
                          <Badge className="ml-auto text-xs">{child.badge}</Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                  {item.badge && (
                    <Badge className="ml-auto text-xs">{item.badge}</Badge>
                  )}
                </Link>
              </Button>
            )}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className={cn('flex items-center space-x-4', className)}>
      <NavigationMenu>
        <NavigationMenuList>
          {visibleItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              {item.children ? (
                <>
                  <NavigationMenuTrigger className={cn(
                    isActive(item.href) && 'bg-accent text-accent-foreground'
                  )}>
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                      {item.children.map((child) => (
                        <NavigationMenuLink key={child.href} asChild>
                          <Link
                            href={child.href}
                            className={cn(
                              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                              isActive(child.href) && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <div className="flex items-center">
                              {child.icon}
                              <span className="ml-2 text-sm font-medium leading-none">
                                {child.label}
                              </span>
                              {child.badge && (
                                <Badge className="ml-auto text-xs">{child.badge}</Badge>
                              )}
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                      isActive(item.href) && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                    {item.badge && (
                      <Badge className="ml-2 text-xs">{item.badge}</Badge>
                    )}
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {showUserMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">
                {user.email?.split('@')[0] || 'Felhasználó'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col space-y-1">
              <span>{user.email}</span>
              {getRoleBadge()}
              {user.universityId && (
                <span className="text-xs text-muted-foreground">
                  Egyetem: {user.universityId}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="w-4 h-4 mr-2" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Beállítások
              </Link>
            </DropdownMenuItem>
            {user.role === UserRole.ADMIN && (
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <Shield className="w-4 h-4 mr-2" />
                  Rendszerbeállítások
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Kijelentkezés
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}