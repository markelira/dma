# Role-Based Navigation Usage Examples

This document shows how to use the role-based navigation components from DAY 3 Step 6.

## Available Components

### 1. RoleBasedNav (Simple)
A simple vertical navigation component that shows role-appropriate menu items.

### 2. RoleBasedNavigation (Advanced)
A comprehensive navigation component with horizontal/vertical modes, dropdown menus, and user management.

## Basic Usage

```tsx
import { RoleBasedNav } from '@/components/navigation/RoleBasedNav';
import { RoleBasedNavigation } from '@/components/navigation/RoleBasedNavigation';

// Simple sidebar navigation
function SimpleSidebar() {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h2 className="text-lg font-semibold">ELIRA</h2>
      </div>
      <RoleBasedNav />
    </div>
  );
}

// Advanced horizontal navigation
function TopNavigation() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <RoleBasedNavigation 
          variant="horizontal" 
          showUserMenu={true}
        />
      </div>
    </header>
  );
}

// Advanced vertical navigation for sidebar
function AdvancedSidebar() {
  return (
    <aside className="w-80 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold">ELIRA Admin</h1>
      </div>
      <div className="px-4">
        <RoleBasedNavigation 
          variant="vertical" 
          showUserMenu={false}
        />
      </div>
    </aside>
  );
}
```

## Layout Integration

```tsx
// app/layout.tsx or dashboard layout
import { RoleBasedNavigation } from '@/components/navigation';
import { AuthProvider } from '@/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto">
            <RoleBasedNavigation 
              variant="horizontal"
              className="py-4"
            />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white shadow-sm">
            <RoleBasedNavigation 
              variant="vertical"
              showUserMenu={false}
              className="p-4"
            />
          </aside>

          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
```

## Navigation Items by Role

### Student (Hallgató)
- Műszerfal
- Kurzusaim
- Beállítások

### Instructor (Oktató)
- Műszerfal
- Kurzus kezelés
- Diákok
- Analitika
- Beállítások

### University Admin (Egyetemi Admin)
- Műszerfal
- Egyetem kezelés
- Jelentések
- Beállítások

### Admin (Rendszer Admin)
- Műszerfal
- Felhasználók
- Kurzusok
- Egyetemek
- Pénzügyek
- Biztonság
- Beállítások

## Customization

### Custom Navigation Items

```tsx
// You can extend the navItems array in RoleBasedNav.tsx
const customNavItems: NavItem[] = [
  {
    label: 'Új funkció',
    href: '/new-feature',
    icon: Star,
    roles: [UserRole.ADMIN]
  },
  // ... other items
];
```

### Styling

```tsx
// Custom styling with Tailwind classes
<RoleBasedNavigation 
  className="bg-blue-900 text-white"
  variant="vertical"
/>

// Custom link styling by overriding CSS
<RoleBasedNav 
  // Links automatically get hover:bg-gray-100 dark:hover:bg-gray-700
/>
```

## Features

- **Automatic Role Filtering**: Only shows navigation items appropriate for user's role
- **Active State Highlighting**: Current page is automatically highlighted
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Includes dark mode styling
- **Permission Integration**: Can check specific permissions beyond just roles
- **User Menu**: Integrated user dropdown with profile and logout options
- **Badge Support**: Show role badges and notification counts
- **Hierarchical Menus**: Support for nested navigation items

## Integration with ProtectedRoute

```tsx
// Combine with ProtectedRoute for complete protection
import { ProtectedRoute } from '@/components/auth';
import { RoleBasedNavigation } from '@/components/navigation';

function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="flex">
        <RoleBasedNavigation variant="vertical" />
        <main className="flex-1">
          <h1>Admin Dashboard</h1>
          {/* Admin content */}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```