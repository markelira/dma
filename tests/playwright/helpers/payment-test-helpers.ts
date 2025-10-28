import { Page } from '@playwright/test';

/**
 * Mock Stripe for testing to avoid real payment processing
 */
export async function mockStripe(page: Page) {
  await page.addInitScript(() => {
    // Mock Stripe object with basic functionality
    (window as any).Stripe = (publishableKey?: string) => ({
      elements: (options?: any) => ({
        create: (type: string, options?: any) => ({
          mount: (elementOrSelector: string | Element) => {
            // Create a mock element in the DOM
            const mockElement = document.createElement('div');
            mockElement.className = 'mock-stripe-element';
            mockElement.setAttribute('data-testid', `${type}-element`);
            mockElement.style.height = '40px';
            mockElement.style.border = '1px solid #ccc';
            mockElement.style.borderRadius = '4px';
            mockElement.style.padding = '10px';
            mockElement.textContent = `Mock ${type} element`;
            
            if (typeof elementOrSelector === 'string') {
              const target = document.querySelector(elementOrSelector);
              if (target) target.appendChild(mockElement);
            } else {
              elementOrSelector.appendChild(mockElement);
            }
          },
          unmount: () => {},
          on: (event: string, handler: Function) => {},
          focus: () => {},
          blur: () => {},
          clear: () => {},
          update: (options: any) => {}
        }),
        submit: () => Promise.resolve({ error: null }),
        fetchUpdates: () => Promise.resolve({ error: null })
      }),
      confirmPayment: (clientSecret: string, options?: any) => 
        Promise.resolve({ 
          error: null, 
          paymentIntent: { 
            status: 'succeeded',
            id: 'pi_mock_payment_intent',
            client_secret: clientSecret
          } 
        }),
      redirectToCheckout: (options: any) => {
        // Mock redirect to checkout - just resolve successfully
        return Promise.resolve({ error: null });
      },
      retrievePaymentIntent: (clientSecret: string) =>
        Promise.resolve({
          paymentIntent: {
            status: 'succeeded',
            id: 'pi_mock_payment_intent'
          }
        })
    });

    // Mock confetti for success page
    (window as any).confetti = (options?: any) => {
      console.log('Mock confetti triggered with options:', options);
      return Promise.resolve();
    };
  });
}

/**
 * Mock Firebase authentication for testing
 */
export async function mockAuth(page: Page, user?: {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
}) {
  await page.addInitScript((userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', 'mock-auth-token');
      
      // Mock Firebase auth state
      (window as any).mockUser = userData;
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      (window as any).mockUser = null;
    }
  }, user);
}

/**
 * Mock course data for testing
 */
export async function mockCourseData(page: Page, courseId: string, courseData?: any) {
  const defaultCourse = {
    id: courseId,
    title: 'Test Course',
    description: 'This is a test course for payment testing',
    price: 49900, // 499 HUF
    currency: 'HUF',
    instructorName: 'Test Instructor',
    duration: '5 hours',
    totalLessons: 10,
    thumbnail: '/mock-course-thumbnail.jpg',
    ...courseData
  };

  await page.addInitScript((course) => {
    (window as any).mockCourseData = course;
  }, defaultCourse);
}

/**
 * Wait for page to load and be ready for testing
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  
  // Wait for React to hydrate
  await page.waitForFunction(() => {
    return (window as any).React !== undefined || 
           document.querySelector('[data-reactroot]') !== null ||
           document.querySelector('#__next') !== null;
  }, { timeout: 10000 });
}

/**
 * Check if element is visible with retry logic
 */
export async function expectVisible(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Navigate to payment success page with test data
 */
export async function navigateToSuccessPage(page: Page, params: {
  courseId?: string;
  sessionId?: string;
  subscriptionId?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.courseId) searchParams.set('courseId', params.courseId);
  if (params.sessionId) searchParams.set('session_id', params.sessionId);
  if (params.subscriptionId) searchParams.set('subscriptionId', params.subscriptionId);
  
  const url = `/payment/success${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  await page.goto(url);
}

/**
 * Test viewport configurations
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  large: { width: 1920, height: 1080 }
};

/**
 * Test user configurations
 */
export const testUsers = {
  student: {
    uid: 'test-student-uid',
    email: 'student@test.com',
    displayName: 'Test Student',
    role: 'STUDENT'
  },
  instructor: {
    uid: 'test-instructor-uid',
    email: 'instructor@test.com',
    displayName: 'Test Instructor',
    role: 'INSTRUCTOR'
  },
  admin: {
    uid: 'test-admin-uid',
    email: 'admin@test.com',
    displayName: 'Test Admin',
    role: 'ADMIN'
  }
};

/**
 * Mock payment session data
 */
export function createMockPaymentSession(overrides: any = {}) {
  return {
    id: 'cs_mock_session_id',
    object: 'checkout.session',
    amount_total: 49900,
    currency: 'huf',
    customer_email: 'test@user.com',
    payment_status: 'paid',
    metadata: {
      courseId: 'test-course',
      userId: 'test-user-id',
      ...overrides.metadata
    },
    ...overrides
  };
}