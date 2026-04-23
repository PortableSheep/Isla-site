# Authentication E2E Tests

Comprehensive end-to-end testing suite for the Isla.site authentication system using Playwright.

## Overview

This test suite covers all authentication flows including signup, login, password reset, session management, and error handling. Tests are designed to verify both happy paths and edge cases.

## Test Coverage

### Main Authentication Tests (8 Tests)

1. **Parent Signup Flow**
   - Navigate to signup page
   - Fill form with email, password, and confirmation
   - Verify success message
   - Check redirect to login page
   - Validate form accessibility

2. **Parent Login Flow**
   - Navigate to login page
   - Enter credentials
   - Verify form submission and response handling
   - Check accessibility of login form

3. **Password Reset Flow**
   - Navigate to forgot password
   - Enter email address
   - Verify success message with email confirmation
   - Validate redirect to login
   - Test accessibility

4. **Session Persistence**
   - Simulate authenticated state
   - Reload page
   - Verify JWT token persists in localStorage
   - Confirm session is maintained

5. **Invalid Credentials**
   - Attempt login with wrong password
   - Verify error message is displayed
   - Check form remains enabled for retry
   - Verify no sensitive info is leaked

6. **Logout Flow**
   - Simulate logged-in state
   - Clear authentication
   - Verify protected pages are inaccessible
   - Confirm localStorage is cleared

7. **Rate Limiting**
   - Attempt multiple rapid login failures
   - Verify error handling
   - Check form remains functional
   - Test accessibility during error state

8. **Email Verification**
   - Signup with email
   - Verify unverified state handling
   - Check email confirmation messaging
   - Validate redirect flow

### Additional Test Groups

**Signup Form Validation (3 Tests)**
- Empty email validation
- Password mismatch detection
- Invalid email format handling

**Login Form Navigation (3 Tests)**
- Navigate signup from login
- Navigate reset password from login
- Navigate login from signup

**Form Accessibility (2 Tests)**
- Label and ARIA attribute verification
- Keyboard navigation testing

**Password Reset Edge Cases (2 Tests)**
- Non-existent account handling
- Email format validation

**Session Management (2 Tests)**
- Manual session clearing
- Session isolation between tabs

## Running Tests

### Run All Auth Tests
```bash
npm run test:auth
```

### Run Tests in Headed Mode (see browser)
```bash
npm run test:auth:headed
```

### Run Tests in Debug Mode
```bash
npm run test:auth:debug
```

### Run Tests in UI Mode (interactive)
```bash
npm run test:auth:ui
```

### View Test Report
```bash
npm run test:e2e:report
```

### Run Specific Test
```bash
npx playwright test tests/e2e/auth.spec.ts -g "Parent Signup Flow"
```

## Test Architecture

### Page Objects (`tests/pages/auth.page.ts`)

The `AuthPage` class encapsulates all selectors and interactions for auth pages:
- Email/password inputs
- Form submission
- Error/success messages
- Navigation links
- Form validation

**Benefits:**
- Centralized selector management
- Easy to maintain when UI changes
- Reusable across multiple tests
- Clear separation of concerns

### Test Helpers (`tests/helpers/auth-helpers.ts`)

Utility functions for common test operations:
- `getStoredToken()` - Retrieve JWT from localStorage
- `isUserAuthenticated()` - Check auth state
- `clearAuth()` - Logout and clear session
- `checkPageRequiresAuth()` - Verify protected pages
- `verifySessionPersistence()` - Test session across reloads
- `checkFormAccessibility()` - Validate accessibility

### Data Factory (`tests/fixtures/data-factory.ts`)

Generate realistic test data using Faker:
- `generateParentUser()` - Create test parent account
- `generateChildUser()` - Create test child account
- `generatePostContent()` - Generate post data
- `generateNotificationPreferences()` - Create notification settings

## Configuration

### Environment Variables (.env.test)

```bash
# Base URL for tests
BASE_URL=http://localhost:3000

# Supabase credentials (for database operations)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Playwright Config (`playwright.config.ts`)

- **Test Directory:** `tests/e2e/`
- **Test Match:** `**/*.spec.ts`
- **Timeout:** 30 seconds per test
- **Retries:** 1 on CI, 0 locally
- **Workers:** 3 locally, 1 on CI
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## Best Practices

### 1. Use Page Objects
Always access UI elements through page object methods, not directly in tests.

```typescript
// ✅ Good
await authPage.fillLoginForm(email, password);

// ❌ Bad
await page.locator('input[type="email"]').fill(email);
```

### 2. Wait for Elements Properly
Use explicit waits and avoid arbitrary timeouts.

```typescript
// ✅ Good
await authPage.successMessage.waitFor({ state: 'visible', timeout: 5000 });

// ❌ Bad
await page.waitForTimeout(2000);
```

### 3. Generate Test Data
Use faker for realistic, unique test data.

```typescript
// ✅ Good
const testUser = generateParentUser();

// ❌ Bad
const email = 'test@example.com';
```

### 4. Clean Up After Tests
Use `beforeEach` and `afterEach` hooks to ensure clean state.

```typescript
test.beforeEach(async ({ page }) => {
  await clearAuth(page);
});

test.afterEach(async ({ page }) => {
  await clearAuth(page);
});
```

### 5. Test Accessibility
Include accessibility checks in your tests.

```typescript
const violations = await checkFormAccessibility(page);
expect(violations).toHaveLength(0);
```

### 6. Use Descriptive Test Names
Test names should clearly describe what is being tested.

```typescript
// ✅ Good
test('Parent Signup Flow - Create account, verify success, and check access', ...);

// ❌ Bad
test('Signup test', ...);
```

## Debugging

### Debug Mode
Run tests with debugging enabled:
```bash
npm run test:auth:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Inspect elements
- Run console commands
- View network traffic

### View Screenshots
Failed tests automatically capture screenshots in `test-results/`.

### View Videos
Videos of failed tests are saved in `test-results/` (if configured).

### Use `page.pause()`
Pause test execution at specific points:
```typescript
await page.pause();
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Pull requests to main branch
- Commits to main branch
- Manual workflow dispatch

### Environment Variables in CI
Set the following secrets in GitHub:
- `BASE_URL` - Test server URL
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### Tests Timeout
Increase timeout in individual tests:
```typescript
test('My test', async ({ page }) => {
  // ...
}, { timeout: 60000 }); // 60 seconds
```

### Elements Not Found
1. Verify selectors with `page.locator()` in debug mode
2. Add `waitForLoadState('networkidle')` before interacting
3. Check if element is hidden or behind another element

### Flaky Tests
1. Use explicit waits instead of fixed timeouts
2. Ensure clean state in `beforeEach`
3. Check for race conditions in async code
4. Use `test.slow()` to triple the timeout:
   ```typescript
   test.slow();
   ```

### Tests Pass Locally but Fail in CI
1. Check environment variables in CI config
2. Verify test data seeding is working
3. Check for hardcoded URLs or localhost references
4. Ensure timestamps/dates don't cause issues

## Writing New Tests

### Template
```typescript
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { clearAuth } from '../helpers/auth-helpers';
import { generateParentUser } from '../fixtures/data-factory';

test.describe('New Auth Feature', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await clearAuth(page);
  });

  test('should do something', async ({ page }) => {
    const testUser = generateParentUser();
    
    // Navigate
    await authPage.navigateToLogin();
    
    // Interact
    await authPage.fillLoginForm(testUser.email, testUser.password);
    await authPage.submitForm();
    
    // Assert
    expect(page.url()).toContain('/dashboard');
  });
});
```

## Performance Tips

1. **Parallelize Tests**
   - Default: 3 workers locally, 1 in CI
   - Increase for faster execution: `workers: 5`

2. **Use --only-changed**
   - Run only tests affected by recent changes
   - Requires Git repository

3. **Disable Slow Motion**
   - By default disabled
   - Use `--slow-motion=1000` to slow down for debugging

4. **Minimize Network Requests**
   - Mock API responses when possible
   - Use `route()` to intercept requests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Faker.js Documentation](https://fakerjs.dev)

## Contributing

When adding new authentication features:

1. Update `AuthPage` with new selectors/methods
2. Add helper functions to `auth-helpers.ts`
3. Create corresponding tests
4. Update this README with new test coverage
5. Ensure all tests pass: `npm run test:auth`
6. Run accessibility checks
7. Submit PR with test coverage

## Support

For issues or questions about these tests:
1. Check existing GitHub issues
2. Review test output and screenshots
3. Use debug mode to investigate
4. Contact the team with detailed reproduction steps
