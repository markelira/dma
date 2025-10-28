# Day 3 Authentication & Authorization Tests

This document describes the comprehensive test suite for Day 3 of the DMA platform development, focusing on Authentication & Authorization features.

## Test Overview

The Day 3 test suite validates the complete authentication and authorization system implementation, including:

- ✅ **User Authentication** (login, registration, logout)
- ✅ **Role-Based Access Control** (Student, Instructor, University Admin, Admin)
- ✅ **Protected Routes** (unauthorized access prevention)
- ✅ **Role-Based Navigation** (dynamic menu based on user role)
- ✅ **Permission System** (resource-action based permissions)
- ✅ **User Interface** (loading states, error handling, user feedback)

## Test Files

### Core Test Suites

1. **`day3-auth.spec.ts`** - Basic authentication and authorization tests (roadmap specification)
2. **`day3-auth-extended.spec.ts`** - Comprehensive extended test scenarios

### Supporting Files

3. **`day3-test-setup.ts`** - Test environment setup and user creation
4. **`day3-global-setup.ts`** - Global test setup (runs before all tests)
5. **`day3-global-teardown.ts`** - Global test cleanup (runs after all tests)
6. **`day3-playwright.config.ts`** - Playwright configuration for Day 3 tests

## Test Users

The test suite uses predefined test users with different roles:

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `student@test.com` | `Test123!` | Student | Basic dashboard, courses |
| `instructor@test.com` | `Test123!` | Instructor | Course management, analytics |
| `university_admin@test.com` | `Test123!` | University Admin | University management |
| `admin@test.com` | `Test123!` | Admin | Full system access |

## Running the Tests

### Prerequisites

1. **Firebase Emulators** must be running:
   ```bash
   firebase emulators:start --only auth,firestore,functions
   ```

2. **Next.js Development Server** must be running:
   ```bash
   npm run dev
   ```

3. **Playwright browsers** must be installed:
   ```bash
   npx playwright install
   ```

### Quick Run

Use the automated test runner script:

```bash
chmod +x scripts/run-day3-tests.sh
./scripts/run-day3-tests.sh
```

### Manual Run

1. Start dependencies:
   ```bash
   # Terminal 1: Firebase Emulators
   firebase emulators:start --only auth,firestore,functions
   
   # Terminal 2: Next.js Dev Server
   npm run dev
   ```

2. Run tests:
   ```bash
   # Run all Day 3 tests
   npx playwright test --config=tests/playwright/day3-playwright.config.ts
   
   # Run specific test file
   npx playwright test day3-auth.spec.ts
   
   # Run in headed mode (see browser)
   npx playwright test --headed day3-auth.spec.ts
   ```

### CI/CD Integration

For automated environments, use:

```bash
# Set CI environment variable
export CI=true

# Run tests with retry and parallel execution disabled
npx playwright test --config=tests/playwright/day3-playwright.config.ts
```

## Test Scenarios

### 1. Authentication Flow Tests

- **User Registration**: Creates new user accounts with student role
- **Login with Different Roles**: Tests role-based redirect after login
- **Invalid Credentials**: Verifies error handling for wrong passwords
- **Password Reset**: Tests forgot password functionality
- **Logout**: Ensures proper session termination

### 2. Protected Routes Tests

- **Unauthenticated Access**: Redirects to login page
- **Cross-Role Access**: Prevents access to unauthorized role-specific pages
- **Permission Validation**: Checks resource-action permissions

### 3. Role-Based Navigation Tests

- **Dynamic Menu Items**: Shows only appropriate navigation for each role
- **Navigation Visibility**: Hides/shows menu items based on permissions
- **User Menu**: Displays correct role badges and user information

### 4. User Interface Tests

- **Loading States**: Verifies spinners during authentication checks
- **Error Messages**: Tests user-friendly error display
- **Unauthorized Page**: Validates helpful unauthorized access page
- **Responsive Design**: Tests on different screen sizes

### 5. Permission System Tests

- **Course Creation**: Tests instructor course creation permissions
- **User Management**: Restricts user management to admins only
- **University Scope**: Tests university-specific access restrictions

## Test Reports

After running tests, reports are generated in multiple formats:

1. **HTML Report**: `tests/playwright-report/day3/index.html`
   - Interactive report with test results, screenshots, and traces
   - Best for development and debugging

2. **JSON Report**: `tests/results/day3-results.json`
   - Machine-readable results for CI/CD integration

3. **JUnit Report**: `tests/results/day3-junit.xml`
   - Standard format for CI/CD systems and test dashboards

## Debugging Failed Tests

### Screenshots and Videos

Failed tests automatically capture:
- **Screenshots** of the failure moment
- **Videos** of the test execution
- **Traces** for step-by-step debugging

### Common Issues

1. **Emulators Not Running**:
   ```
   Error: connect ECONNREFUSED 127.0.0.1:9099
   ```
   **Solution**: Start Firebase emulators with `firebase emulators:start`

2. **Next.js Not Running**:
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3000
   ```
   **Solution**: Start Next.js with `npm run dev`

3. **Test Users Not Found**:
   ```
   Error: auth/user-not-found
   ```
   **Solution**: Restart emulators or run global setup manually

### Debug Mode

Run tests with debugging options:

```bash
# Run with browser visible
npx playwright test --headed day3-auth.spec.ts

# Run with debugging pause
npx playwright test --debug day3-auth.spec.ts

# Run single test
npx playwright test day3-auth.spec.ts -t "Login with different roles"
```

## Test Environment

### Firebase Emulator Configuration

The tests use Firebase emulators with these ports:
- **Authentication**: `localhost:9099`
- **Firestore**: `localhost:8080`
- **Functions**: `localhost:5001`

### Browser Support

Tests run on multiple browsers:
- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 12)

## Contributing

When adding new authentication features:

1. **Add Test Coverage**: Create tests in `day3-auth-extended.spec.ts`
2. **Update Test Users**: Modify `day3-test-setup.ts` if new roles needed
3. **Document Changes**: Update this documentation
4. **Run Full Suite**: Ensure all existing tests still pass

## Performance Considerations

- Tests run in parallel by default (can be disabled with `--workers=1`)
- Test users are reused across tests for speed
- Emulators are shared between test runs
- Failed tests automatically retry once on CI

## Security Notes

- Test users have predictable passwords (`Test123!`) - **NEVER use in production**
- Tests run against local emulators only - **NO production data access**
- Test data is ephemeral and cleared when emulators restart
- All test credentials are public and documented

---

For questions or issues with the test suite, please refer to the main project documentation or create an issue in the project repository.