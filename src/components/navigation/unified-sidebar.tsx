'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/authStore'
import {
  Home,
  BookOpen,
  GraduationCap,
  Award,
  Settings,
  Bell,
  Compass,
  TrendingUp,
  Heart,
  Video,
  MessageSquare,
  FileText,
  Users,
  BarChart3,
  Shield,
  Database,
  Activity,
  Building2,
  UserCog,
  FileSearch,
  AlertTriangle,
  Calendar,
  DollarSign,
  FolderTree
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const allNavItems: NavItem[] = [
  // Common items for all users
  {
    title: 'Főoldal',
    href: '/dashboard',
    icon: Home,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
  },
  
  // University Admin dashboard
  {
    title: 'Egyetem Dashboard',
    href: '/university-admin/dashboard',
    icon: Home,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  
  // University Admin specific
  {
    title: 'Tartalmak',
    href: '/university-admin/courses',
    icon: BookOpen,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Oktatók',
    href: '/university-admin/instructors',
    icon: UserCog,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Hallgatók',
    href: '/university-admin/students',
    icon: GraduationCap,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Beiratkozások',
    href: '/university-admin/enrollments',
    icon: Users,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Pénzügyek',
    href: '/university-admin/finance',
    icon: DollarSign,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Jelentések',
    href: '/university-admin/reports',
    icon: BarChart3,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Ütemezés',
    href: '/university-admin/schedule',
    icon: Calendar,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  {
    title: 'Egyetem Beállítások',
    href: '/university-admin/settings',
    icon: Settings,
    roles: ['UNIVERSITY_ADMIN', 'university_admin']
  },
  
  // Student specific
  {
    title: 'Beiratkozásaim',
    href: '/dashboard/my-learning',
    icon: BookOpen,
    roles: ['STUDENT']
  },
  {
    title: 'Böngészés',
    href: '/dashboard/browse',
    icon: Compass,
    roles: ['STUDENT']
  },
  {
    title: 'Számlák',
    href: '/dashboard/invoices',
    icon: FileText,
    roles: ['STUDENT']
  },
  {
    title: 'Segítségkérés',
    href: '/dashboard/help-center',
    icon: MessageSquare,
    roles: ['STUDENT']
  },
  
  // Instructor specific
  {
    title: 'Tartalmaim',
    href: '/instructor/courses',
    icon: BookOpen,
    roles: ['INSTRUCTOR']
  },
  {
    title: 'Új tartalom',
    href: '/instructor/courses/create',
    icon: Video,
    roles: ['INSTRUCTOR']
  },
  {
    title: 'Diákok',
    href: '/instructor/students',
    icon: Users,
    roles: ['INSTRUCTOR']
  },
  {
    title: 'Értékelések',
    href: '/instructor/reviews',
    icon: MessageSquare,
    roles: ['INSTRUCTOR']
  },
  {
    title: 'Források',
    href: '/instructor/resources',
    icon: FileText,
    roles: ['INSTRUCTOR']
  },
  
  // Admin specific
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: Shield,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Felhasználók',
    href: '/admin/users',
    icon: UserCog,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Tartalom kezelés',
    href: '/admin/courses',
    icon: BookOpen,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Kategóriák',
    href: '/admin/categories',
    icon: FolderTree,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Célközönségek',
    href: '/admin/target-audiences',
    icon: Users,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Oktatók',
    href: '/admin/instructors',
    icon: UserCog,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Egyetemek',
    href: '/admin/universities',
    icon: Building2,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Rendszer állapot',
    href: '/admin/system-status',
    icon: Activity,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Audit napló',
    href: '/admin/audit-log',
    icon: FileSearch,
    roles: ['ADMIN'] // CSAK admin
  },
  {
    title: 'Támogatási jegyek',
    href: '/admin/reports',
    icon: AlertTriangle,
    roles: ['ADMIN'] // CSAK admin
  },
  
  // Common for instructor
  {
    title: 'Elemzések',
    href: '/instructor/analytics',
    icon: BarChart3,
    roles: ['INSTRUCTOR']
  },
  {
    title: 'Értesítések',
    href: '/dashboard/notifications',
    icon: Bell,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
  },
  {
    title: 'Beállítások',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
  }
]

interface UnifiedSidebarProps {
  userRole: string
}

export function UnifiedSidebar({ userRole }: UnifiedSidebarProps) {
  const pathname = usePathname()
  const [openTicketsCount, setOpenTicketsCount] = useState(0)
  const [hasUnreadResponses, setHasUnreadResponses] = useState(false)
  const { user } = useAuthStore()
  
  // Debug log
  console.log('UnifiedSidebar userRole:', userRole, 'user:', user?.uid)
  
  // Count open tickets for admin
  useEffect(() => {
    if (userRole !== 'ADMIN') return

    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('status', '==', 'open')
    )

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      setOpenTicketsCount(snapshot.size)
    }, (error) => {
      console.error('Error fetching ticket count:', error)
    })

    return () => unsubscribe()
  }, [userRole])
  
  // Check for unread responses for students
  useEffect(() => {
    if (userRole !== 'STUDENT' || !user?.uid) {
      console.log('Skipping unread check - not student or no user')
      return
    }

    console.log('Checking unread responses for student:', user.uid)
    
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      let hasUnread = false
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log('Ticket:', doc.id, 'hasUnreadResponse:', data.hasUnreadResponse)
        // Check if ticket has unread admin responses
        if (data.hasUnreadResponse === true) {
          hasUnread = true
        }
      })
      
      console.log('Has unread responses:', hasUnread)
      setHasUnreadResponses(hasUnread)
    }, (error) => {
      console.error('Error checking unread responses:', error)
    })

    return () => unsubscribe()
  }, [userRole, user])
  
  // Filter nav items based on user role (check both formats for university admin)
  const navItems = allNavItems.filter(item => {
    if (userRole === 'UNIVERSITY_ADMIN' || userRole === 'university_admin') {
      return item.roles.includes('UNIVERSITY_ADMIN') || item.roles.includes('university_admin');
    }
    return item.roles.includes(userRole);
  })
  
  // Group items by category
  const adminItems = navItems.filter(item => item.href.startsWith('/admin'))
  const instructorItems = navItems.filter(item => item.href.startsWith('/instructor'))
  const universityAdminItems = navItems.filter(item => item.href.startsWith('/university-admin'))
  const commonItems = navItems.filter(item => 
    !item.href.startsWith('/admin') && 
    !item.href.startsWith('/instructor') && 
    !item.href.startsWith('/university-admin')
  )

  console.log('UnifiedSidebar navItems:', navItems.length, 'adminItems:', adminItems.length)

  // Ha nincs menüelem, ne jelenjen meg a sidebar
  if (navItems.length === 0) {
    console.log('UnifiedSidebar: No items to show, returning null')
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <nav className="flex-1 flex flex-col gap-1 p-4 pt-2">
        {/* Admin section */}
        {adminItems.length > 0 && userRole === 'ADMIN' && (
          <>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">
              Adminisztráció
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isReportsPage = item.href === '/admin/reports'
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-red-50 text-red-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-red-600" : "text-gray-500"
                  )} />
                  <span className="flex-1">{item.title}</span>
                  {isReportsPage && openTicketsCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {openTicketsCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </>
        )}
        
        {/* University Admin section */}
        {universityAdminItems.length > 0 && (userRole === 'UNIVERSITY_ADMIN' || userRole === 'university_admin') && (
          <>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">
              Egyetem Adminisztráció
            </div>
            {universityAdminItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand-secondary/5 text-brand-secondary shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-brand-secondary" : "text-gray-500"
                  )} />
                  {item.title}
                </Link>
              )
            })}
          </>
        )}
        
        {/* Instructor section */}
        {instructorItems.length > 0 && userRole === 'INSTRUCTOR' && (
          <>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">
              Oktatói funkciók
            </div>
            {instructorItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-purple-50 text-purple-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-purple-600" : "text-gray-500"
                  )} />
                  {item.title}
                </Link>
              )
            })}
          </>
        )}
        
        {/* Common section */}
        {commonItems.length > 0 && (
          <>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">
              Általános
            </div>
            {commonItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isHelpCenter = item.href === '/dashboard/help-center'

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#466C95]/10 text-[#466C95] shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-[#466C95]" : "text-gray-500"
                    )} />
                    {isHelpCenter && hasUnreadResponses && userRole === 'STUDENT' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="flex-1">{item.title}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}