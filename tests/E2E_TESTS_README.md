# Family Management E2E Tests

Comprehensive end-to-end tests for Isla.site family management features using Playwright.

## Test Coverage

### Main Test Suite: `family.spec.ts` (9 tests)

#### 1. **Create Family**
   - Tests parent can create a new family
   - Verifies family appears in the family list
   - Validates dashboard navigation and family creation flow

#### 2. **Generate Invite Token**
   - Tests parent can generate invite tokens for family
   - Verifies token is displayed and can be copied
   - Validates token sharing capability

#### 3. **Child Accepts Invite**
   - Tests child can signup using invite link
   - Verifies account is created with pending approval status
   - Validates invite redemption flow

#### 4. **Parent Approves Child**
   - Tests parent can approve pending child accounts
   - Verifies child gains access to family wall after approval
   - Validates audit log entry creation

#### 5. **Parent Rejects Child**
   - Tests parent can reject pending child accounts
   - Verifies rejected child cannot access family
   - Validates audit log entry for rejection

#### 6. **Multi-Family Switching**
   - Tests parent can manage multiple families
   - Verifies parent can switch between families
   - Validates children see only their assigned family
   - Ensures wall content is family-specific

#### 7. **Family Member Listing**
   - Tests parent can view all family members
   - Verifies roles are displayed (parent/child)
   - Validates member status is shown (pending/active/suspended)

#### 8. **Permission Verification**
   - Tests child has restricted access
   - Verifies cannot access admin panel
   - Verifies cannot access family settings
   - Verifies cannot access approvals page
   - Validates can access wall and create posts

#### 9. **Leave Family**
   - Tests parent can leave family
   - Verifies parent is removed from family
   - Validates access is revoked after leaving

### Error Cases

Additional error handling tests:
- Invalid invite token handling
- Duplicate family name validation
- Unapproved child access denial

## Setup

### Prerequisites

- Node.js 18+
- Application running on http://localhost:3000 (or configured BASE_URL)
- Playwright dependencies installed

### Installation

```bash
# Install Playwright and dependencies
npm install

# Install Playwright browsers (one-time setup)
npx playwright install
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/family.spec.ts
```

### Run Specific Test

```bash
npx playwright test tests/e2e/family.spec.ts -g "Create Family"
```

### Run with UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run with Debug Mode

```bash
npx playwright test --debug
```

### Run Against Specific Browser

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari only
npx playwright test --project=webkit
```

### Run with Video Recording

```bash
npx playwright test --video=on
```

## Test Configuration

Edit `playwright.config.ts` to customize:

- **Test Directory**: `./tests/e2e`
- **Base URL**: Default `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Retries**: 0 (local), 1 (CI)
- **Workers**: 3 (local), 1 (CI)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

### Environment Variables

```bash
# Custom base URL
BASE_URL=http://localhost:8080 npx playwright test

# CI mode
CI=true npx playwright test
```

## Page Objects

Test suite uses Page Object Model for maintainability:

### `AuthPage`
- `loginAsParent(email, password)`
- `loginAsChild(email, password)`
- `logout()`
- `isLoggedIn()`

### `FamilyPage`
- `createFamily(name)`
- `generateInviteToken()`
- `acceptInvite(token, name, age)`
- `approvePendingChild(name)`
- `rejectPendingChild(name)`
- `switchFamily(name)`
- `getFamilyMembers()`
- `verifyChildCanAccessWall()`
- `verifyChildCannotAccessAdminPanel()`
- `navigateToWall()`, `navigateToDashboard()`, etc.

## Test Data

Tests use realistic names and data:

**Families:**
- Johnson Family
- Smith Household

**Children:**
- Emma Johnson (8 years old)
- Liam Johnson (10 years old)
- Sophia Smith (7 years old)

**Parent Account:**
- Email: parent@example.com
- Password: SecurePassword123!

## Reports

After running tests, view reports:

```bash
# Open HTML report
npx playwright show-report

# View JSON results
cat test-results/results.json

# View JUnit XML
cat test-results/junit.xml
```

Test artifacts are saved in:
- `playwright-report/` - HTML report
- `test-results/` - JSON and JUnit results
- Screenshots (on failure) - in test-results
- Videos (on failure) - in test-results

## Debugging

### View Test Trace

If a test fails, Playwright records a trace:

```bash
npx playwright show-trace test-results/trace.zip
```

### Slow Motion

Run tests in slow motion to see what's happening:

```bash
npx playwright test --headed --slow-mo=1000
```

### Inspect Elements

Use Inspector to debug selectors:

```bash
npx playwright test --debug --headed
```

## Best Practices

1. **Use Page Objects**: All navigation and interactions go through AuthPage and FamilyPage
2. **Wait for Elements**: Tests include proper waits for network requests and DOM updates
3. **Realistic Data**: Uses realistic family and child names
4. **Error Testing**: Includes error cases like invalid tokens and access denial
5. **Isolation**: Each test is independent and can run in any order
6. **Cleanup**: Browser contexts are properly closed after tests

## Troubleshooting

### Tests Fail with "Application not accessible"

Ensure:
- Application is running: `npm run dev`
- Base URL is correct: `BASE_URL=http://localhost:3000`
- Port is not in use

### Tests Timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 seconds
```

### Selectors Not Found

Common issues:
- UI elements have changed
- Selector is too specific
- Page didn't fully load

Use Inspector to verify selectors:
```bash
npx playwright test --debug --headed
```

### Tests Pass Locally But Fail in CI

Possible causes:
- Different environment setup
- Missing environment variables
- Timing issues
- Database state

Review CI logs and use `--headed` to see what's happening.

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use realistic names and data
3. Include both success and error cases
4. Update page objects if needed
5. Add comments explaining the test flow
6. Ensure tests are independent

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: npx playwright test
  env:
    BASE_URL: http://localhost:3000

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```
