# Notification E2E Tests - Quick Reference

## File Location
`tests/e2e/notifications.spec.ts`

## Quick Start

### Run all notification tests
```bash
npm test -- tests/e2e/notifications.spec.ts
```

### Run specific test
```bash
npm test -- -g "Mark Notification as Read"
```

### Run with UI
```bash
npm test -- tests/e2e/notifications.spec.ts --ui
```

### Debug mode
```bash
npm test -- tests/e2e/notifications.spec.ts --debug
```

## Test Summary (12 Main Tests)

| # | Test | Purpose | Key Validations |
|---|------|---------|-----------------|
| 1 | Receive Notification on Isla Update | Notify when posts created | Bell visible, badge shows, dropdown works |
| 2 | Receive Notification on Reply | Notify on replies to post | Reply notification appears, unread count increments |
| 3 | Mark Notification as Read | Mark read functionality | Read state changes, badge decreases |
| 4 | Delete Notification | Delete from dropdown | Notification removed, count updated |
| 5 | Access Notification Center | Full notifications page | Page loads, URL correct, content renders |
| 6 | Filter Notifications by Type | Filter by category | Updates, Replies, All filters work |
| 7 | Mark All as Read | Bulk read action | All badges removed, unread count = 0 |
| 8 | Notification Preferences Saved | Preference persistence | Settings saved, persist after reload |
| 9 | Digest Mode Preference | Configure digest | Day/time/frequency saved |
| 10 | Notification Link Navigation | Click notification | Navigate to correct page/context |
| 11 | Multiple Notifications Display | Multiple notification handling | Count matches, sorting correct |
| 12 | Notification Refresh and Real-time Updates | Cross-session sync | New notifications appear |

## Test Data
- Parent: `notif-parent@example.com` / `SecurePassword123!`
- Child: `notif-child@example.com` / `SecurePassword123!`
- Posts: "Morning family update...", "Grocery shopping", "Beautiful sunset..."

## Key Selectors Used
```
Bell Icon: [aria-label="Notifications"]
Badge: .bg-amber-500
Dropdown: div[class*="right-0"][class*="mt-2"][class*="w-96"]
Notifications: div[class*="border-b"][class*="p-4"]
Delete Button: button[aria-label="Delete"]
Mark All Read: button:has-text("Mark all read")
```

## Browser Coverage
- Chromium, Firefox, Safari (Desktop)
- iOS (iPhone 12), Android (Pixel 5)

## Reports
- HTML: `playwright-report/index.html`
- JSON: `test-results/results.json`
- JUnit: `test-results/junit.xml`

## Expected Results

### Success
✓ All 12 tests pass on each browser
✓ No console errors or JS exceptions
✓ Notifications appear/disappear correctly
✓ Counts remain accurate
✓ Settings persist after reload

### Coverage
✓ Bell icon and badge display
✓ Dropdown interactions
✓ Mark as read/delete
✓ Full notification page
✓ Filtering/sorting
✓ Preferences
✓ Navigation
✓ Real-time updates

## Common Issues & Fixes

### Tests fail with timeout
- Check if server is running: `npm run dev`
- Increase timeout in `playwright.config.ts`
- Check network connectivity

### Selectors not found
- May need to update selectors in test if UI changes
- Use `--debug` flag to inspect elements
- Check if page has loaded: `await page.waitForLoadState('networkidle')`

### Flaky tests
- Add longer delays for async operations
- Use `waitForLoadState` instead of fixed delays
- Ensure test data exists before assertions

## Integration

These tests are:
- Run on CI/CD on every commit
- Part of main test suite
- Configured in `playwright.config.ts`
- Use existing page objects from `/tests/pages/`
- Follow project testing conventions

## Documentation
See `NOTIFICATIONS_E2E_TESTS.md` for detailed documentation.
