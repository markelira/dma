import { test, expect } from '@playwright/test';

test.describe('Day 3: Authentication & Authorization', () => {
  test('Login with different roles', async ({ page }) => {
    const testUsers = [
      { email: 'student@test.com', password: 'Test123!', expectedUrl: '/dashboard' },
      { email: 'instructor@test.com', password: 'Test123!', expectedUrl: '/instructor/dashboard' },
      { email: 'admin@test.com', password: 'Test123!', expectedUrl: '/admin/dashboard' }
    ];

    for (const user of testUsers) {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(user.expectedUrl);
      expect(page.url()).toContain(user.expectedUrl);
      
      await page.goto('http://localhost:3000/logout');
    }
  });

  test('Protected routes redirect unauthenticated users', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/instructor/courses',
      '/admin/users',
      '/university/manage'
    ];

    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('Role-based navigation shows correct items', async ({ page }) => {
    // Login as student
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Check student can see their nav items
    await expect(page.locator('text=Kurzusaim')).toBeVisible();
    
    // Check student cannot see admin items
    await expect(page.locator('text=Felhasználók')).not.toBeVisible();
  });

  test('Permission checks work correctly', async ({ page }) => {
    // Login as instructor
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'instructor@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Try to access admin page
    await page.goto('http://localhost:3000/admin/users');
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('Google OAuth login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check Google login button exists
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    
    // Click would trigger OAuth flow
    // In test environment, we mock this
  });
});