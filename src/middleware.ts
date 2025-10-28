import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/auth/authProvider';

// Route protection configuration
interface RouteConfig {
  path: string;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  redirect?: string;
  allowPublic?: boolean;
  universityScope?: boolean;
}

// Protected routes configuration
const protectedRoutes: RouteConfig[] = [
  // Admin routes
  {
    path: '/admin',
    requiredRole: UserRole.ADMIN,
    redirect: '/login'
  },
  {
    path: '/admin/:path*',
    requiredRole: UserRole.ADMIN,
    redirect: '/login'
  },
  
  // University admin routes
  {
    path: '/university-admin',
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN],
    redirect: '/login',
    universityScope: true
  },
  {
    path: '/university-admin/:path*',
    requiredRole: [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN],
    redirect: '/login',
    universityScope: true
  },
  
  // Instructor routes
  {
    path: '/instructor',
    requiredRole: [UserRole.ADMIN, UserRole.INSTRUCTOR],
    redirect: '/login'
  },
  {
    path: '/instructor/:path*',
    requiredRole: [UserRole.ADMIN, UserRole.INSTRUCTOR],
    redirect: '/login'
  },
  
  // Dashboard (authenticated users only)
  {
    path: '/dashboard',
    redirect: '/login'
  },
  {
    path: '/dashboard/:path*',
    redirect: '/login'
  },
  
  // Course management
  {
    path: '/courses/create',
    requiredRole: [UserRole.ADMIN, UserRole.INSTRUCTOR],
    redirect: '/login'
  },
  {
    path: '/courses/:courseId/edit',
    requiredPermission: {
      resource: 'courses',
      action: 'update'
    },
    redirect: '/login'
  },
  
  // Profile routes (authenticated only)
  {
    path: '/profile',
    redirect: '/login'
  },
  {
    path: '/me',
    redirect: '/login'
  },
  
  // Public routes (no protection)
  {
    path: '/',
    allowPublic: true
  },
  {
    path: '/login',
    allowPublic: true
  },
  {
    path: '/register',
    allowPublic: true
  },
  {
    path: '/forgot-password',
    allowPublic: true
  },
  {
    path: '/courses',
    allowPublic: true
  },
  {
    path: '/courses/:courseId',
    allowPublic: true
  },
  {
    path: '/trending',
    allowPublic: true
  },
  {
    path: '/career-paths',
    allowPublic: true
  }
];

// Helper function to match path patterns
function matchPath(pattern: string, pathname: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/:\w+/g, '[^/]+')  // :param -> [^/]+
    .replace(/\*/g, '.*')       // * -> .*
    .replace(/\+/g, '.+');      // + -> .+
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

// Find matching route configuration
function findRouteConfig(pathname: string): RouteConfig | null {
  return protectedRoutes.find(route => matchPath(route.path, pathname)) || null;
}

// Extract custom claims from JWT token (simplified version)
async function getCustomClaimsFromRequest(request: NextRequest): Promise<any> {
  try {
    // In a real implementation, you would decode the Firebase ID token
    // This is a simplified version for demonstration
    const authCookie = request.cookies.get('__session')?.value;
    
    if (!authCookie) {
      return null;
    }

    // Here you would verify the Firebase ID token and extract custom claims
    // For now, we'll return null to indicate no claims available in middleware
    // The actual authentication check will happen on the client side
    return null;
  } catch (error) {
    console.error('Error extracting claims from request:', error);
    return null;
  }
}

// Check if user has required role
function hasRequiredRole(userRole: UserRole | undefined, requiredRole: UserRole | UserRole[]): boolean {
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware in development mode for easier testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: skipping auth middleware for', pathname);
    return NextResponse.next();
  }
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') ||
    pathname.startsWith('/static/')
  ) {
    return NextResponse.next();
  }

  // Find route configuration
  const routeConfig = findRouteConfig(pathname);
  
  // If no configuration found, allow public access
  if (!routeConfig) {
    return NextResponse.next();
  }

  // If route is explicitly public, allow access
  if (routeConfig.allowPublic) {
    return NextResponse.next();
  }

  // Get custom claims from request (simplified)
  const claims = await getCustomClaimsFromRequest(request);
  
  // If no authentication found and route requires authentication
  if (!claims && !routeConfig.allowPublic) {
    const redirectUrl = new URL(routeConfig.redirect || '/login', request.url);
    redirectUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If route requires specific role
  if (routeConfig.requiredRole && claims) {
    const hasRole = hasRequiredRole(claims.role, routeConfig.requiredRole);
    
    if (!hasRole) {
      const redirectUrl = new URL('/unauthorized', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // University scope check
  if (routeConfig.universityScope && claims) {
    const isUniversityScoped = (
      claims.role === UserRole.UNIVERSITY_ADMIN || 
      claims.role === UserRole.INSTRUCTOR
    );
    
    if (isUniversityScoped && !claims.universityId) {
      const redirectUrl = new URL('/unauthorized', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Add custom headers for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Route-Config', JSON.stringify(routeConfig));
    response.headers.set('X-User-Claims', JSON.stringify(claims));
  }

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Export route configurations for use in other parts of the app
export { protectedRoutes, type RouteConfig };