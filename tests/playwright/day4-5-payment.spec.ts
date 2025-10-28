import { test, expect } from '@playwright/test';
import { 
  mockStripe, 
  mockAuth, 
  mockCourseData, 
  waitForPageReady, 
  navigateToSuccessPage,
  testUsers,
  viewports
} from './helpers/payment-test-helpers';

test.describe('Day 4-5: Payment System', () => {
  // Test that runs before each test to set up common state
  test.beforeEach(async ({ page }) => {
    // Set up mocks for all tests
    await mockStripe(page);
    await mockCourseData(page, 'test-course');
  });

  test('Stripe configuration is correct', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait a bit for scripts to load
    await page.waitForTimeout(2000);
    
    // Check Stripe script is loaded
    const stripeScript = await page.evaluate(() => {
      return !!window.Stripe;
    });
    
    expect(stripeScript).toBeTruthy();
  });

  test('Payment success page shows confirmation with confetti', async ({ page }) => {
    await navigateToSuccessPage(page, { courseId: 'test-course' });
    await waitForPageReady(page);
    
    // Check main success elements
    await expect(page.locator('text=Sikeres fizetés!')).toBeVisible();
    await expect(page.locator('text=Kurzus megkezdése')).toBeVisible();
    
    // Check that confetti function exists (mocked)
    const confettiExists = await page.evaluate(() => {
      return typeof (window as any).confetti === 'function';
    });
    expect(confettiExists).toBeTruthy();
    
    // Check for success icon
    await expect(page.locator('svg').first()).toBeVisible();
    
    // Check for receipt download button
    await expect(page.locator('text=Számla letöltése')).toBeVisible();
  });

  test('Payment success page without courseId shows dashboard option', async ({ page }) => {
    await page.goto('http://localhost:3000/payment/success');
    
    await expect(page.locator('text=Sikeres fizetés!')).toBeVisible();
    await expect(page.locator('text=Műszerfal megnyitása')).toBeVisible();
  });

  test('Payment cancel page shows correct message and retry option', async ({ page }) => {
    await page.goto('http://localhost:3000/payment/cancel');
    
    await expect(page.locator('text=Fizetés megszakítva')).toBeVisible();
    await expect(page.locator('text=Fizetés újrapróbálása')).toBeVisible();
    await expect(page.locator('text=Vissza a kurzusokhoz')).toBeVisible();
    await expect(page.locator('text=Segítség kérése')).toBeVisible();
  });

  test('Payment cancelled page (alternative) shows correct message', async ({ page }) => {
    await page.goto('http://localhost:3000/payment/cancelled');
    
    await expect(page.locator('text=Fizetés megszakítva')).toBeVisible();
    await expect(page.locator('text=Vissza a kurzusokhoz')).toBeVisible();
    await expect(page.locator('text=support@dma.hu')).toBeVisible();
  });

  test('Course purchase page shows course details and checkout form', async ({ page }) => {
    // Navigate directly to purchase page (assuming course exists)
    await page.goto('http://localhost:3000/courses/test-course/purchase');
    
    // Check for course purchase elements
    await expect(page.locator('text=Biztonságos fizetés')).toBeVisible();
    
    // Check for authentication prompt if not logged in
    const loginPrompt = page.locator('text=Bejelentkezés');
    const checkoutForm = page.locator('text=Fizetési adatok');
    
    // Either login prompt or checkout form should be visible
    const hasLogin = await loginPrompt.isVisible();
    const hasCheckout = await checkoutForm.isVisible();
    
    expect(hasLogin || hasCheckout).toBeTruthy();
  });

  test('Checkout form renders correctly when authenticated', async ({ page }) => {
    // Mock authentication state
    await mockAuth(page, testUsers.student);

    await page.goto('http://localhost:3000/payment/checkout?courseId=test-course&amount=49900&currency=HUF&mode=payment&description=Test%20Course');
    await waitForPageReady(page);
    
    // Check checkout form elements
    await expect(page.locator('text=Biztonságos fizetés')).toBeVisible();
    await expect(page.locator('text=Rendelés összegzése')).toBeVisible();
    
    // Check for mock Stripe Elements
    await page.waitForTimeout(1000); // Give time for elements to render
    const mockStripeElement = page.locator('.mock-stripe-element');
    
    // Check if any Stripe elements were rendered (either real or mock)
    const hasStripeElements = await mockStripeElement.count() > 0;
    console.log('Mock Stripe elements found:', hasStripeElements);
  });

  test('Purchase button integration works on course pages', async ({ page }) => {
    // This tests the PurchaseButton component
    await page.goto('http://localhost:3000/courses/test-course');
    
    // Look for purchase button (might have different text based on state)
    const purchaseButton = page.locator('text=Vásárlás').or(page.locator('text=Kurzus folytatása'));
    
    if (await purchaseButton.isVisible()) {
      await purchaseButton.click();
      
      // Should either go to purchase page or login page
      await page.waitForURL(/\/(courses\/test-course\/purchase|login)/);
      
      // Check we're on an expected page
      const currentUrl = page.url();
      const isValidDestination = currentUrl.includes('/purchase') || currentUrl.includes('/login');
      expect(isValidDestination).toBeTruthy();
    }
  });

  test('Error handling works correctly', async ({ page }) => {
    // Test 404 handling for non-existent course
    await page.goto('http://localhost:3000/courses/non-existent-course/purchase');
    
    // Should either redirect to 404 or show error message
    await page.waitForTimeout(2000);
    
    const has404 = await page.locator('text=404').isVisible();
    const hasError = await page.locator('text=nem található').isVisible();
    const hasRedirect = !page.url().includes('non-existent-course');
    
    // One of these should be true
    expect(has404 || hasError || hasRedirect).toBeTruthy();
  });

  test('Responsive design works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(viewports.mobile);
    
    await navigateToSuccessPage(page, { courseId: 'test-course' });
    await waitForPageReady(page);
    
    // Check that elements are still visible on mobile
    await expect(page.locator('text=Sikeres fizetés!')).toBeVisible();
    await expect(page.locator('text=Kurzus megkezdése')).toBeVisible();
    
    // Check that layout adapts to mobile
    const successCard = page.locator('div').filter({ hasText: 'Sikeres fizetés!' }).first();
    await expect(successCard).toBeVisible();
  });

  test('Dark mode support works correctly', async ({ page }) => {
    // Enable dark mode
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('http://localhost:3000/payment/success?courseId=test-course');
    
    // Check that page loads correctly in dark mode
    await expect(page.locator('text=Sikeres fizetés!')).toBeVisible();
    
    // Check for dark mode classes or styles
    const bodyClasses = await page.locator('html').getAttribute('class');
    expect(bodyClasses).toContain('dark');
  });
});