# Integration Tests Quick Reference

## Running Tests

### All Integration Tests
```bash
npx playwright test tests/e2e/integration.spec.ts
```

### Specific Test
```bash
npx playwright test tests/e2e/integration.spec.ts -g "User Signup"
```

### By Browser
```bash
# Chrome only (fastest)
npx playwright test tests/e2e/integration.spec.ts --project=chromium

# Firefox
npx playwright test tests/e2e/integration.spec.ts --project=firefox

# Safari
npx playwright test tests/e2e/integration.spec.ts --project=webkit

# Mobile Chrome
npx playwright test tests/e2e/integration.spec.ts --project="Mobile Chrome"

# Mobile Safari
npx playwright test tests/e2e/integration.spec.ts --project="Mobile Safari"
```

### Different Modes
```bash
# UI mode (interactive debugging)
npm run test:e2e:ui

# Headed mode (see browser)
npx playwright test tests/e2e/integration.spec.ts --headed

# Debug mode (step through)
npx playwright test tests/e2e/integration.spec.ts --debug

# Verbose output
DEBUG=pw:api npx playwright test tests/e2e/integration.spec.ts
```

## Test List

1. ✓ Complete User Signup Journey
2. ✓ Parent Creating Family & Inviting Child
3. ✓ Child Creating and Sharing a Post
4. ✓ Parent Moderating Child's Posts
5. ✓ Multi-Child Collaboration
6. ✓ Settings & Preferences Update
7. ✓ Account Security
8. ✓ Family Permissions & Access Control
9. ✓ Notification System
10. ✓ Complete Logout and Session Cleanup

## Setup

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, run tests
npx playwright test tests/e2e/integration.spec.ts

# 3. View report
npx playwright show-report
```

## Environment Variables

Create `.env.test`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_key
SUPABASE_SERVICE_ROLE_KEY=test_service_key
BASE_URL=http://localhost:3000
TEST_PARENT_EMAIL=parent@test.com
TEST_PARENT_PASSWORD=SecurePassword123!
```

## Debugging

### UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
Time-travel debugging, inspect elements, see test execution replay.

### Headed Mode
```bash
npx playwright test tests/e2e/integration.spec.ts --headed
```
See browser windows with test execution.

### Debug Mode
```bash
npx playwright test tests/e2e/integration.spec.ts --debug
```
Step-through debugger with DevTools integration.

### Add Pause in Test
```typescript
await page.pause(); // Opens DevTools in browser
```

### Check Videos/Screenshots
- `tests/videos/` - Failure videos
- `tests/screenshots/` - Failure screenshots
- `playwright-report/` - HTML test report

## Performance

- **Single Browser**: ~1-2 minutes
- **All Browsers**: ~5-10 minutes
- **Parallel Execution**: Default 3 workers
- **For Speed**: `--project=chromium` (Chrome only)

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout to 60 seconds
npx playwright test tests/e2e/integration.spec.ts --timeout 60000
```

### Dev Server Not Running
```bash
npm run dev
# Check: http://localhost:3000
```

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Clear Cache & Cookies
```bash
# Tests automatically clear between runs
# But if needed, manually clear browser data and restart
```

## Test Coverage

### User Journeys Tested
- ✓ Signup → Login → Dashboard
- ✓ Family creation and management
- ✓ Post creation and sharing
- ✓ Moderation workflows
- ✓ Multi-user collaboration
- ✓ Settings and preferences
- ✓ Password security
- ✓ Access control
- ✓ Notifications
- ✓ Logout and session cleanup

### Browsers Tested
- ✓ Chrome (Desktop)
- ✓ Firefox (Desktop)
- ✓ Safari (Desktop)
- ✓ Chrome (Mobile)
- ✓ Safari (Mobile)

## Common Commands

```bash
# Run integration tests only
npx playwright test tests/e2e/integration.spec.ts

# Run all E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific test with pattern
npx playwright test -g "Signup"

# List all tests
npx playwright test tests/e2e/integration.spec.ts --list

# Run with single worker (sequential)
npx playwright test tests/e2e/integration.spec.ts --workers=1

# Update snapshots
npx playwright test tests/e2e/integration.spec.ts --update-snapshots

# Generate report
npx playwright test tests/e2e/integration.spec.ts && npx playwright show-report
```

## Files

- **Tests**: `tests/e2e/integration.spec.ts`
- **Page Objects**: `tests/pages/` (index.ts, settings.page.ts, moderation.page.ts)
- **Fixtures**: `tests/fixtures/auth.ts`, `tests/fixtures/data-factory.ts`
- **Config**: `playwright.config.ts`
- **Documentation**: `tests/README.md`, `INTEGRATION_TESTS_SUMMARY.md`

## Exit Codes

- `0` - All tests passed
- `1` - Test failed
- `2` - Test timeout
- `3` - Interrupted

## CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull request to `main` or `develop`

Artifacts uploaded:
- `playwright-report/` - Test report
- `test-videos/` - Failure videos (7 day retention)
- `test-screenshots/` - Failure screenshots (7 day retention)

## Next Steps

1. Run integration tests: `npx playwright test tests/e2e/integration.spec.ts`
2. Review results: `npx playwright show-report`
3. Debug failures: `npm run test:e2e:ui`
4. Add new tests following patterns in integration.spec.ts
5. Update documentation as needed
