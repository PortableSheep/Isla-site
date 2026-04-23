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
