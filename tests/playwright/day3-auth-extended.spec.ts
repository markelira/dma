import { test, expect } from '@playwright/test';

test.describe('Day 3: Extended Authentication & Authorization Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:3000');
  });

  test.describe('Authentication Flow', () => {
    test('Registration creates new user with student role', async ({ page }) => {
      await page.goto('http://localhost:3000/register');
      
      // Fill registration form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Student');
      await page.fill('input[name="email"]', 'newstudent@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      
      // Should redirect to onboarding or dashboard
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
    });

    test('Login shows loading state and redirects correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      // Fill login form
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      
      // Click submit and check for loading state
      await page.click('button[type="submit"]');
      await expect(page.locator('.animate-spin')).toBeVisible();
      
      // Wait for redirect
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
    });

    test('Invalid credentials show error message', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      
      await page.fill('input[name="email"]', 'invalid@test.com');
      await page.fill('input[name="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text="Hibás email vagy jelszó"')).toBeVisible();
    });

    test('Password reset flow works', async ({ page }) => {
      await page.goto('http://localhost:3000/forgot-password');
      
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text="Email elküldve"')).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('Student cannot access instructor routes', async ({ page }) => {
      // Login as student
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Try to access instructor routes
      const instructorRoutes = [
        '/instructor/dashboard',
        '/instructor/courses',
        '/instructor/students',
        '/instructor/analytics'
      ];
      
      for (const route of instructorRoutes) {
        await page.goto(`http://localhost:3000${route}`);
        await expect(page).toHaveURL(/\/unauthorized/);
      }
    });

    test('Instructor cannot access admin routes', async ({ page }) => {
      // Login as instructor
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'instructor@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/instructor/dashboard');
      
      // Try to access admin routes
      const adminRoutes = [
        '/admin/users',
        '/admin/settings',
        '/admin/analytics',
        '/admin/security'
      ];
      
      for (const route of adminRoutes) {
        await page.goto(`http://localhost:3000${route}`);
        await expect(page).toHaveURL(/\/unauthorized/);
      }
    });

    test('University admin cannot access system admin routes', async ({ page }) => {
      // Login as university admin
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'university_admin@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/university/dashboard');
      
      // Try to access system admin routes
      const systemAdminRoutes = [
        '/admin/users',
        '/admin/universities',
        '/admin/system-status'
      ];
      
      for (const route of systemAdminRoutes) {
        await page.goto(`http://localhost:3000${route}`);
        await expect(page).toHaveURL(/\/unauthorized/);
      }
    });
  });

  test.describe('Role-Based Navigation', () => {
    test('Student navigation shows correct items', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Should see student navigation items
      await expect(page.locator('text=Műszerfal')).toBeVisible();
      await expect(page.locator('text=Kurzusaim')).toBeVisible();
      await expect(page.locator('text=Beállítások')).toBeVisible();
      
      // Should NOT see other role items
      await expect(page.locator('text=Kurzus kezelés')).not.toBeVisible();
      await expect(page.locator('text=Felhasználók')).not.toBeVisible();
      await expect(page.locator('text=Egyetem kezelés')).not.toBeVisible();
    });

    test('Instructor navigation shows correct items', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'instructor@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/instructor/dashboard');
      
      // Should see instructor navigation items
      await expect(page.locator('text=Műszerfal')).toBeVisible();
      await expect(page.locator('text=Kurzus kezelés')).toBeVisible();
      await expect(page.locator('text=Diákok')).toBeVisible();
      await expect(page.locator('text=Analitika')).toBeVisible();
      await expect(page.locator('text=Beállítások')).toBeVisible();
      
      // Should NOT see admin items
      await expect(page.locator('text=Felhasználók')).not.toBeVisible();
      await expect(page.locator('text=Egyetemek')).not.toBeVisible();
      await expect(page.locator('text=Biztonság')).not.toBeVisible();
    });

    test('Admin navigation shows all items', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/admin/dashboard');
      
      // Should see all navigation items
      await expect(page.locator('text=Műszerfal')).toBeVisible();
      await expect(page.locator('text=Felhasználók')).toBeVisible();
      await expect(page.locator('text=Kurzusok')).toBeVisible();
      await expect(page.locator('text=Egyetemek')).toBeVisible();
      await expect(page.locator('text=Pénzügyek')).toBeVisible();
      await expect(page.locator('text=Biztonság')).toBeVisible();
      await expect(page.locator('text=Beállítások')).toBeVisible();
    });
  });

  test.describe('User Menu & Profile', () => {
    test('User menu shows correct role badge', async ({ page }) => {
      // Test each role
      const users = [
        { email: 'student@test.com', password: 'Test123!', role: 'Hallgató' },
        { email: 'instructor@test.com', password: 'Test123!', role: 'Oktató' },
        { email: 'admin@test.com', password: 'Test123!', role: 'Rendszer Admin' }
      ];

      for (const user of users) {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="email"]', user.email);
        await page.fill('input[name="password"]', user.password);
        await page.click('button[type="submit"]');
        
        // Click user menu
        await page.click('[data-testid="user-menu"]');
        
        // Check role badge
        await expect(page.locator(`text=${user.role}`)).toBeVisible();
        
        // Logout for next iteration
        await page.click('text=Kijelentkezés');
        await page.waitForURL('/');
      }
    });

    test('Logout works correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Click user menu and logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Kijelentkezés');
      
      // Should redirect to home page
      await expect(page).toHaveURL('/');
      
      // Try to access protected route, should redirect to login
      await page.goto('http://localhost:3000/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Permission System', () => {
    test('Course creation permission works', async ({ page }) => {
      // Login as instructor (should have course creation permission)
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'instructor@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      
      // Navigate to course creation
      await page.goto('http://localhost:3000/instructor/courses/create');
      
      // Should be able to access the page (not redirect to unauthorized)
      await expect(page).not.toHaveURL(/\/unauthorized/);
      await expect(page.locator('h1:has-text("Kurzus létrehozása")')).toBeVisible();
    });

    test('User management permission restricted to admins', async ({ page }) => {
      // Login as instructor
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'instructor@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      
      // Try to access user management
      await page.goto('http://localhost:3000/admin/users');
      await expect(page).toHaveURL(/\/unauthorized/);
    });
  });

  test.describe('Unauthorized Page', () => {
    test('Unauthorized page shows helpful information', async ({ page }) => {
      // Login as student
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      
      // Try to access admin page
      await page.goto('http://localhost:3000/admin/users');
      await expect(page).toHaveURL(/\/unauthorized/);
      
      // Check unauthorized page content
      await expect(page.locator('h1:has-text("Hozzáférés megtagadva")')).toBeVisible();
      await expect(page.locator('text=student@test.com')).toBeVisible();
      await expect(page.locator('text=Hallgató')).toBeVisible();
      
      // Check action buttons
      await expect(page.locator('button:has-text("Vissza")')).toBeVisible();
      await expect(page.locator('button:has-text("Főoldal")')).toBeVisible();
      await expect(page.locator('button:has-text("Jogosultságok frissítése")')).toBeVisible();
    });

    test('Back button works on unauthorized page', async ({ page }) => {
      // Login as student and navigate to dashboard
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Try to access admin page (will redirect to unauthorized)
      await page.goto('http://localhost:3000/admin/users');
      await expect(page).toHaveURL(/\/unauthorized/);
      
      // Click back button
      await page.click('button:has-text("Vissza")');
      
      // Should go back to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Loading States', () => {
    test('Protected route shows loading spinner during auth check', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Should show loading spinner while checking auth
      await expect(page.locator('.animate-spin')).toBeVisible();
      
      // Then redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});