# Day 4-5 Payment System Tests

This directory contains Playwright end-to-end tests for the payment system implemented in Day 4.

## Test Files

- `day4-5-payment.spec.ts` - Main test suite for payment functionality
- `day4-5-payment.config.ts` - Playwright configuration for payment tests
- `helpers/payment-test-helpers.ts` - Utility functions for payment testing

## What's Being Tested

### Core Payment Functionality
- ✅ Stripe configuration and script loading
- ✅ Payment success page with confetti animation
- ✅ Payment cancel/cancelled pages
- ✅ Course purchase flow
- ✅ Checkout form rendering

### User Experience
- ✅ Responsive design (mobile/desktop)
- ✅ Dark mode support
- ✅ Authentication states
- ✅ Error handling
- ✅ Purchase button integration

### Security & Reliability
- ✅ Mock Stripe integration (no real payments in tests)
- ✅ Authentication state management
- ✅ Error boundary testing
- ✅ 404 handling for non-existent courses

## Running the Tests

### Prerequisites
1. Make sure the development server is running: `npm run dev`
2. Ensure Firebase emulators are running if needed
3. Install Playwright if not already installed: `npx playwright install`

### Run Payment Tests
```bash
# Run all payment tests
npx playwright test --config=tests/playwright/day4-5-payment.config.ts

# Run specific test
npx playwright test day4-5-payment.spec.ts

# Run with UI mode
npx playwright test --ui day4-5-payment.spec.ts

# Run on specific browser
npx playwright test --project=chromium day4-5-payment.spec.ts
```

### Debug Tests
```bash
# Run in headed mode (see browser)
npx playwright test --headed day4-5-payment.spec.ts

# Debug specific test
npx playwright test --debug day4-5-payment.spec.ts

# Generate test report
npx playwright show-report test-results/day4-5-payment
```

## Test Environment Setup

### Mocking Strategy
- **Stripe**: All Stripe functionality is mocked to prevent real payments
- **Firebase**: Authentication and database calls are mocked
- **Confetti**: Animation library is mocked for consistent testing

### Test Data
- Uses predefined test users (student, instructor, admin)
- Mock course data for consistent testing
- Mock payment sessions and responses

### Browser Support
- **Chromium**: Primary testing browser
- **Mobile**: iPhone 12 simulation for responsive testing
- **Other browsers**: Can be added to config as needed

## Test Helpers

### Available Helper Functions
```typescript
// Mock Stripe for safe testing
await mockStripe(page);

// Mock user authentication
await mockAuth(page, testUsers.student);

// Mock course data
await mockCourseData(page, 'test-course');

// Navigate to success page with params
await navigateToSuccessPage(page, { courseId: 'test-course' });

// Wait for page to be ready
await waitForPageReady(page);
```

### Test Users
```typescript
testUsers.student   // Regular student user
testUsers.instructor // Course instructor
testUsers.admin     // Platform admin
```

### Viewport Configurations
```typescript
viewports.mobile    // 375x667 (iPhone)
viewports.tablet    // 768x1024 (iPad)
viewports.desktop   // 1280x720 (Desktop)
viewports.large     // 1920x1080 (Large Desktop)
```

## Test Scenarios Covered

### 1. Payment Success Flow
- Success page renders correctly
- Confetti animation triggers
- Course-specific actions are shown
- Receipt download is available
- Auto-redirect works for general success

### 2. Payment Cancel Flow
- Cancel page shows appropriate message
- Retry functionality works
- Support contact information is displayed
- No charges confirmation is clear

### 3. Course Purchase Flow
- Purchase page loads with course details
- Authentication prompts work correctly
- Checkout form renders properly
- Purchase button integration functions

### 4. Error Handling
- 404 pages for non-existent courses
- Network error handling
- Invalid payment data handling
- Authentication error scenarios

### 5. Responsive Design
- Mobile viewport compatibility
- Tablet and desktop layouts
- Touch-friendly interfaces
- Proper text scaling

### 6. Accessibility
- Screen reader compatibility
- Keyboard navigation
- Focus management
- Color contrast compliance

## Test Results and Reporting

### Output Formats
- **HTML Report**: Visual test results with screenshots
- **JSON Report**: Machine-readable test data
- **Console Output**: Real-time test progress

### Artifacts
- Screenshots on failure
- Video recordings for failed tests
- Network traces for debugging
- Browser console logs

## Continuous Integration

### CI/CD Integration
Tests are configured to run in CI environments with:
- Headless browser execution
- Parallel test execution
- Artifact collection
- Retry logic for flaky tests

### Environment Variables
```bash
CI=true                    # Enables CI mode
PLAYWRIGHT_HEADLESS=true   # Forces headless mode
BASE_URL=http://localhost:3000  # Test server URL
```

## Troubleshooting

### Common Issues

1. **Stripe not loading**: Check internet connection and mock setup
2. **Page timeout**: Increase timeout or check server startup
3. **Element not found**: Verify Hungarian text matches exactly
4. **Test flakiness**: Add wait conditions or increase timeouts

### Debug Tips
- Use `--headed` flag to see browser actions
- Add `await page.pause()` to stop execution
- Check console output for error messages
- Use `page.screenshot()` to capture state

### Performance
- Tests run sequentially to avoid payment conflicts
- Mock heavy operations (Stripe, Firebase)
- Use efficient selectors
- Minimize wait times where possible

## Future Enhancements

### Planned Additions
- Integration with real Stripe test mode
- Performance testing for payment flows
- Accessibility testing automation
- Visual regression testing
- Cross-browser testing expansion

### Test Coverage Goals
- 100% payment flow coverage
- All error scenarios tested
- Complete mobile experience validation
- Full accessibility compliance testing