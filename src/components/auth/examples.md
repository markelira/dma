# Protected Route Usage Examples

This document shows how to use the new ProtectedRoute component from DAY 3 Step 5.

## Basic Usage

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/contexts/AuthContext';

// Protect a page that requires authentication
function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}

// Protect a page that requires specific roles
function AdminOnlyPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div>This content is only visible to admins</div>
    </ProtectedRoute>
  );
}

// Protect a page that requires multiple roles (OR logic)
function StaffPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
      <div>This content is visible to admins OR instructors</div>
    </ProtectedRoute>
  );
}

// Protect a page with specific permissions
function CourseManagementPage() {
  return (
    <ProtectedRoute 
      requiredPermission={{
        resource: 'courses',
        action: 'create'
      }}
    >
      <div>This content requires course creation permissions</div>
    </ProtectedRoute>
  );
}

// Custom redirect for unauthorized access
function SpecialPage() {
  return (
    <ProtectedRoute 
      requiredRoles={[UserRole.INSTRUCTOR]}
      redirectTo="/instructor-signup"
    >
      <div>Special instructor content</div>
    </ProtectedRoute>
  );
}
```

## Usage in Next.js Pages

```tsx
// pages/admin/dashboard/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="p-6">
        <h1>Admin Dashboard</h1>
        {/* Admin dashboard content */}
      </div>
    </ProtectedRoute>
  );
}
```

## Features

- **Authentication Check**: Automatically redirects to login if user is not authenticated
- **Role-based Access**: Support for checking multiple roles (OR logic)
- **Permission-based Access**: Check specific resource/action permissions
- **Loading States**: Shows spinner while checking authentication
- **Redirect Support**: Custom redirect URLs with return path support
- **Unauthorized Handling**: Automatic redirect to `/unauthorized` page for access denied

## Integration with AuthProvider

Make sure to wrap your app with AuthProvider:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```