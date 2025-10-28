import { test, expect } from '@playwright/test';

test.describe('Day 1: Security Implementation', () => {
  test('Environment variables are not exposed', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check page source doesn't contain keys
    const content = await page.content();
    expect(content).not.toContain('sk_live');
    expect(content).not.toContain('AIzaSy');
    expect(content).not.toContain('firebase-adminsdk');
  });

  test('Firestore rules prevent unauthorized access', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Try to access protected data without auth
    const response = await page.evaluate(async () => {
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      try {
        await getDocs(collection(db, 'users'));
        return 'success';
      } catch (error) {
        return 'blocked';
      }
    });
    
    expect(response).toBe('blocked');
  });

  test('API endpoints require authentication', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });
});