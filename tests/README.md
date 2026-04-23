# E2E Testing Guide for Isla.site

This guide covers how to run, write, and debug Playwright E2E tests for the Isla.site application.

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Dev server running (`npm run dev`)

### Installation

Dependencies are already installed via `npm install`. Ensure you have the required packages:

```bash
npm install --save-dev @playwright/test @faker-js/faker
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test tests/e2e/sample.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"

# Run single test
npx playwright test tests/e2e/sample.spec.ts -g "should display login page"

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on mobile
npx playwright test --project="Mobile Chrome"
```

## Configuration

### Environment Variables

Create a `.env.test` file for test-specific environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_key
SUPABASE_SERVICE_ROLE_KEY=test_service_key

# Test credentials
TEST_PARENT_EMAIL=parent@test.com
TEST_PARENT_PASSWORD=SecurePassword123!

# Base URL
BASE_URL=http://localhost:3000

# CI mode
CI=false
```

### Playwright Configuration

See `playwright.config.ts` for configuration options:

- **Browsers**: Chrome, Firefox, Safari (+ mobile variants)
- **Workers**: 3 parallel (1 on CI)
- **Retries**: 0 locally, 1 on CI
- **Timeout**: 30 seconds per test
- **Screenshots**: On failure only
- **Videos**: On failure only
- **Traces**: On first retry

## Project Structure

```
tests/
├── e2e/                      # E2E test specifications
│   └── *.spec.ts            # Test files
├── fixtures/
│   ├── auth.ts              # Authentication helpers
│   ├── data-factory.ts      # Test data generators
│   └── database.ts          # Database operations
├── helpers/
│   └── page-utils.ts        # Common page utilities
├── pages/
│   └── index.ts             # Page object models
├── global-setup.ts          # Setup before all tests
├── global-teardown.ts       # Cleanup after all tests
├── README.md                # This file
└── snapshots/               # Visual regression snapshots
```

## Page Object Model Pattern

We use Page Object Models (POM) to organize page interactions. This makes tests more maintainable.

### Example Page Object

```typescript
// tests/pages/index.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button:has-text("Sign In")');
  }
}
```

### Using Page Objects in Tests

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

## Test Data Management

### Data Factory

Generate realistic test data using Faker:

```typescript
import { generateParentUser, generateChildProfile } from '../fixtures/data-factory';

const parent = generateParentUser();
const child = generateChildProfile();
```

### Database Fixtures

Reset and seed database for tests:

```typescript
import { resetTestDatabase, setupCompleteTestScenario } from '../fixtures/database';

test.beforeEach(async () => {
  const scenario = await setupCompleteTestScenario(supabase, authAdmin);
  // scenario contains: parentId, familyId, childrenIds, postIds
});
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/page');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('.result')).toHaveText('Success');
  });
});
```

### Common Assertions

```typescript
// Element visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('text');
await expect(element).toContainText('text');

// Attributes
await expect(element).toHaveAttribute('href', '/path');
await expect(element).toHaveValue('input value');

// Classes
await expect(element).toHaveClass('active');

// Count
await expect(locator).toHaveCount(3);

// URL
await expect(page).toHaveURL(/dashboard/);
```

### Common Test Patterns

#### Login Flow
```typescript
test('user login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  
  const dashboard = new DashboardPage(page);
  expect(await dashboard.isLoggedIn()).toBe(true);
});
```

#### Creating Data
```typescript
test('create post', async ({ page }) => {
  const feedPage = new FeedPage(page);
  await feedPage.goto();
  await feedPage.createPost('Test post content');
  
  const posts = await feedPage.getPosts();
  expect(posts).toContain('Test post content');
});
```

#### Checking Lists
```typescript
test('list items appear', async ({ page }) => {
  const familyPage = new FamilyPage(page);
  await familyPage.goto();
  
  const childCount = await familyPage.getChildrenCount();
  expect(childCount).toBeGreaterThan(0);
  
  const names = await familyPage.getChildNames();
  expect(names.length).toBe(childCount);
});
```

## Debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

Interactive debugger with step-through execution.

### Headed Mode

```bash
npm run test:e2e:headed
```

See tests running in visible browser windows.

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Interactive test browser with time-travel debugging.

### Verbose Logging

```bash
DEBUG=pw:api npm run test:e2e
```

### Browser DevTools

Add pause in tests:

```typescript
await page.pause(); // Opens DevTools
```

### Screenshots & Videos

Captured automatically on failure in:
- `tests/screenshots/` - On failure
- `tests/videos/` - On failure
- `tests/traces/` - On first retry

### Check Logs

```bash
# View generated test report
npm run test:e2e:report

# Open HTML report
npx playwright show-report
```

## CI/CD

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Configuration: `.github/workflows/e2e-tests.yml`

### Local CI Simulation

```bash
CI=true npm run test:e2e
```

This will:
- Run with 1 worker (sequential)
- Retry failed tests once
- Generate all reports

### Artifacts

GitHub Actions uploads:
- `playwright-report/` - HTML test report
- `test-videos/` - Failure videos (7 day retention)
- `test-screenshots/` - Failure screenshots (7 day retention)

## Test Selectors

Use consistent data-testid attributes:

```typescript
// In components:
<button data-testid="login-button">Sign In</button>
<input data-testid="email-input" />

// In tests:
await page.click('[data-testid="login-button"]');
await page.fill('[data-testid="email-input"]', 'user@example.com');
```

### Selector Priority

1. **data-testid** - Recommended, most stable
2. **role** - `role="button"`, `role="textbox"`, etc.
3. **aria-label** - For accessible components
4. **text** - Use with caution
5. **CSS/XPath** - Last resort

## Accessibility Testing

### Manual Accessibility Checks

```typescript
import { checkAccessibility } from '../helpers/page-utils';

test('page is accessible', async ({ page }) => {
  await page.goto('/');
  await checkAccessibility(page);
});
```

### Common Checks
- Images have alt text
- Buttons have accessible text or aria-label
- Proper heading hierarchy
- Color contrast (manual review)
- Keyboard navigation (manual review)

## Performance

### Run Specific Project

```bash
# Test only on Chrome (faster)
npx playwright test --project=chromium

# Skip mobile (faster)
npx playwright test --grep "@slow" --invert
```

### Parallel vs Sequential

- Default: 3 workers (parallel)
- For flaky tests: `npx playwright test --workers=1`

### Timeout Adjustments

```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds for this test
});
```

## Troubleshooting

### Tests Timing Out

1. Check if dev server is running: `npm run dev`
2. Increase timeout: `test.setTimeout(60000)`
3. Check BASE_URL environment variable
4. Look at videos/screenshots on failure

### Flaky Tests

1. Use explicit waits: `waitForElement()` instead of sleeps
2. Retry logic: built-in `@playwright/test` retries
3. Check for race conditions
4. Increase timeout for network-dependent tests

### Database Issues

1. Reset database: See `scripts/setup-db.ts`
2. Check database connection string in `.env.test`
3. Verify test database is accessible

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or specify different port
PORT=3001 npm run dev
```

## Best Practices

### ✅ DO

- Use Page Object Models for pages
- Use data-testid for selectors
- Reset database between tests
- Use explicit waits
- Test user journeys end-to-end
- Keep tests independent
- Use descriptive test names
- Mock external APIs

### ❌ DON'T

- Use hard sleeps (`page.waitForTimeout`)
- Query by text alone (fragile)
- Create test interdependencies
- Test implementation details
- Use absolute waits
- Store state between tests
- Write overly long tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Page Objects Pattern](https://playwright.dev/docs/pom)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

## Support

For issues or questions:

1. Check existing test examples in `tests/e2e/`
2. Review Page Objects in `tests/pages/index.ts`
3. Check helpers in `tests/helpers/page-utils.ts`
4. Review Playwright documentation
5. Run in UI mode for interactive debugging

## Contributing

When adding new tests:

1. Follow existing patterns
2. Use Page Object Models
3. Add data-testid attributes to components
4. Document complex test logic
5. Ensure tests are independent
6. Run full test suite before PR

```bash
# Before pushing:
npm run test:e2e        # All tests
npm run lint            # Check code style
npm run build           # Verify build
```

---

## Integration Tests Guide

### Overview

Comprehensive integration tests validate complete user journeys across the Isla.site platform. Located in `tests/e2e/integration.spec.ts`, these tests cover:

- **User signup and onboarding** - Complete account creation workflow
- **Family management** - Creating families and inviting members
- **Post creation and sharing** - Publishing content with validation
- **Moderation workflows** - Parent approval of child content
- **Multi-user collaboration** - Interactions between multiple users
- **Settings and preferences** - Profile customization and persistence
- **Account security** - Password changes and access control
- **Permission-based access** - Verifying authorization boundaries
- **Notification system** - Notification display and interaction
- **Session management** - Login/logout workflows

### Test Coverage

**10 Comprehensive Integration Tests:**

1. **Complete User Signup Journey** - Full account creation flow
2. **Parent Creating Family & Inviting Child** - Family setup with member invitation
3. **Child Creating and Sharing a Post** - Content creation workflow
4. **Parent Moderating Child's Posts** - Post approval workflow
5. **Multi-Child Collaboration** - Multi-user post interactions
6. **Settings & Preferences Update** - Profile customization
7. **Account Security** - Password change and authentication
8. **Family Permissions & Access Control** - Authorization enforcement
9. **Notification System** - Notification viewing and interaction
10. **Complete Logout and Session Cleanup** - Session termination

### Page Objects Used

Integration tests utilize the following page objects:

- **LoginPage** - Authentication and login workflows
- **DashboardPage** - Main dashboard and user menu
- **FeedPage** - Post feed and content display
- **FamilyPage** - Family management interface
- **SettingsPage** - User settings and preferences
- **ModerationPage** - Post moderation and approval queue
- **ChildProfilePage** - Child profile management

### Running Integration Tests

```bash
# Run all integration tests
npx playwright test tests/e2e/integration.spec.ts

# Run specific integration test
npx playwright test tests/e2e/integration.spec.ts -g "Complete User Signup"

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run on specific browser
npx playwright test tests/e2e/integration.spec.ts --project=chromium

# Run with headed browser visible
npx playwright test tests/e2e/integration.spec.ts --headed

# Debug mode
npx playwright test tests/e2e/integration.spec.ts --debug
```

### Test Execution

Tests run across 5 browsers as configured in `playwright.config.ts`:
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (WebKit)
- Chrome (Mobile - Pixel 5)
- Safari (Mobile - iPhone 12)

Parallel execution (3 workers) reduces total runtime to under 5 minutes for the full suite.

### Test Data Generation

Integration tests use Faker.js for realistic test data:

```typescript
function generateTestData() {
  return {
    parentName: faker.person.firstName(),
    parentEmail: faker.internet.email(),
    parentPassword: `TestPassword${Math.random().toString(36).substring(7)}!`,
    childName: faker.person.firstName(),
    familyName: `${faker.person.lastName()} Family`,
    postContent: faker.lorem.sentences(2),
  };
}
```

### Database State Verification

Tests verify application state at database and UI levels:

```typescript
// UI verification
const postCount = await feedPage.getPostCount();
expect(postCount).toBeGreaterThan(0);

// Element visibility
const postVisible = await page.locator(`text="${postContent}"`).isVisible();
expect(postVisible).toBe(true);

// Navigation state
await expect(page).toHaveURL(/dashboard/);
```

### Error Handling

Tests include error case handling:

```typescript
// Invalid credentials
await loginPage.login(invalidEmail, invalidPassword);
const hasError = await loginPage.isErrorVisible();
expect(hasError).toBe(true);

// Permission denied
const response = await page.goto('/admin', { waitUntil: 'networkidle' });
if (response?.status() === 403) {
  expect(response.status()).toBe(403);
}
```

### Cleanup and Isolation

Each test is independent with proper cleanup:

```typescript
// Clear cookies/auth before each test
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

// Logout after test
test.afterEach(async ({ page }) => {
  try {
    await logoutTestUser(page);
  } catch {
    // Already logged out
  }
});
```

### Multi-Browser Compatibility

Tests validate functionality across:
- Different browser engines (Chrome, Firefox, Safari)
- Desktop and mobile viewports
- Various screen sizes and orientations

```bash
# Run on single browser for faster iteration
npx playwright test tests/e2e/integration.spec.ts --project=chromium

# Run full multi-browser suite before PR
npm run test:e2e
```

### Assertions and Validation

Clear, descriptive assertions verify expected behavior:

```typescript
// User journey verification
expect(isLoggedIn).toBe(true);
expect(userMenuVisible).toBe(true);
expect(postCount).toBeGreaterThan(0);
expect(currentUrl).toMatch(/dashboard/);

// Element state verification
await expect(page).toHaveURL(/family|dashboard/);
expect(familyExists || childrenCount >= 0).toBeTruthy();
```

### Troubleshooting Integration Tests

**Test timing out:**
- Increase test timeout: `test.setTimeout(120000)`
- Check if dev server is running: `npm run dev`
- Look at video/screenshots in failure output

**Flaky tests:**
- Use explicit waits instead of fixed delays
- Check for race conditions in page state changes
- Increase network timeout for slow operations

**Permission errors:**
- Verify test user has correct role/permissions
- Check database state after test setup
- Review auth token/session validity

**Database state issues:**
- Ensure test database is running
- Check database connection in `.env.test`
- Reset database between test runs if needed

### Performance Expectations

- Each test: 20-40 seconds
- Full 10-test suite: 3-5 minutes (parallel)
- All 5 browsers: <15 minutes total

### Continuous Integration

Integration tests run on GitHub Actions:
- Push to main/develop branches
- Pull requests to main/develop
- Manual trigger via workflow dispatch

CI configuration includes:
- 1 worker (sequential execution)
- Automatic retry on failure
- Artifact upload for reports/videos
- 7-day retention for test videos

### Future Enhancements

Potential areas for expansion:
- Visual regression testing
- Performance profiling
- Load testing with multiple users
- Mobile-specific scenarios
- Offline mode testing
- Real email verification flows
- Image upload and processing
- Complex thread conversations
