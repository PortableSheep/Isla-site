# Notification E2E Tests Documentation

## Overview

Comprehensive end-to-end tests for Isla.site notification system (`tests/e2e/notifications.spec.ts`).

Tests cover the complete notification lifecycle including delivery, display, user interactions, preferences, and navigation.

## Test Suite Structure

### Test File
- **Location**: `tests/e2e/notifications.spec.ts`
- **Framework**: Playwright
- **Total Tests**: 12 comprehensive test cases
- **Coverage**: All major notification features

## Test Cases

### 1. Receive Notification on Isla Update ✓
**Purpose**: Verify notifications appear when Isla posts updates

**Steps**:
1. Parent logs in
2. Admin creates Isla update (or parent posts)
3. Verify notification bell is visible
4. Click bell to open notifications dropdown
5. Verify notification appears in dropdown with unread badge

**Validates**:
- Notification delivery on update creation
- Bell icon visibility
- Dropdown functionality
- Unread badge display

---

### 2. Receive Notification on Reply ✓
**Purpose**: Parent receives notification when child replies to post

**Steps**:
1. Parent logs in and creates post
2. Child (simulated) replies to post
3. Verify parent receives reply notification
4. Check unread badge increments

**Validates**:
- Reply notification delivery
- Unread count accuracy
- Notification badge updates
- Database consistency

---

### 3. Mark Notification as Read ✓
**Purpose**: Clicking notification marks it as read

**Steps**:
1. Parent has unread notifications
2. Open notification dropdown
3. Click unread notification (non-delete area)
4. Verify notification marked as read (highlight removed)
5. Verify unread count decreases

**Validates**:
- Mark as read functionality
- UI state updates
- Badge count decrements
- Visual indication of read/unread state

---

### 4. Delete Notification ✓
**Purpose**: Users can delete notifications

**Steps**:
1. Open notification dropdown
2. Locate notification with delete button
3. Click delete (trash icon)
4. Verify notification removed from list
5. Verify unread count updated if applicable

**Validates**:
- Delete functionality
- DOM removal
- Count updates
- No orphaned data

---

### 5. Access Notification Center ✓
**Purpose**: Full notification center page loads

**Steps**:
1. Click "View all notifications" link in dropdown
2. Or navigate directly to `/notifications`
3. Verify page loads with all notifications
4. Verify page title/header visible
5. Verify content is rendered

**Validates**:
- Page navigation
- Full notification list display
- Pagination presence
- Page structure

---

### 6. Filter Notifications by Type ✓
**Purpose**: Filter notifications by category

**Steps**:
1. Navigate to notification center
2. Locate filter buttons/tabs (Updates, Replies, All)
3. Click "Updates" filter
4. Verify only update notifications shown
5. Click "Replies" filter
6. Verify only reply notifications shown
7. Click "All" to reset filters

**Validates**:
- Filter functionality
- Filtering accuracy
- Filter UI interaction
- Content updates on filter change

---

### 7. Mark All as Read ✓
**Purpose**: Mark all notifications as read at once

**Steps**:
1. Verify multiple unread notifications exist
2. Click "Mark all read" button
3. Verify all unread badges removed
4. Verify unread count = 0
5. Verify all notifications show read state

**Validates**:
- Bulk read functionality
- UI state updates
- Badge removal
- Database bulk update

---

### 8. Notification Preferences Saved ✓
**Purpose**: Notification preferences persist across sessions

**Steps**:
1. Navigate to `/settings`
2. Locate notification preference toggles
3. Toggle "Email for updates" ON
4. Toggle "In-app for replies" OFF
5. Click Save button
6. Verify success/confirmation
7. Reload page
8. Verify settings still toggled as saved

**Validates**:
- Preference persistence
- Database storage
- Settings UI functionality
- Session persistence

---

### 9. Digest Mode Preference ✓
**Purpose**: Configure digest email settings

**Steps**:
1. Navigate to `/settings`
2. Set email frequency to "Digest"
3. Set digest day to "Monday"
4. Set digest time to "9:00 AM"
5. Save preferences
6. Reload page
7. Verify settings persisted

**Validates**:
- Digest configuration
- Time/date selector functionality
- Preference persistence
- Database constraints

---

### 10. Notification Link Navigation ✓
**Purpose**: Clicking notification navigates to correct context

**Steps**:
1. Create post or receive notification
2. Open notification dropdown
3. Click notification (on content, not delete)
4. Verify navigation to `/wall` or relevant page
5. Verify specific post/thread highlighted or in view
6. Verify full context readable

**Validates**:
- Navigation links correctness
- Deep linking functionality
- URL handling
- Content accessibility

---

### 11. Multiple Notifications Display ✓
**Purpose**: Multiple notifications display correctly

**Steps**:
1. Create multiple posts or generate multiple notifications
2. Verify all notifications appear in dropdown
3. Check that recent notifications listed first
4. Verify unread count matches notification count
5. Verify pagination if 20+ notifications

**Validates**:
- Multiple notification handling
- List rendering
- Count accuracy
- Sorting/ordering (recency)

---

### 12. Notification Refresh and Real-time Updates ✓
**Purpose**: Real-time notification delivery across sessions

**Steps**:
1. Open two browser tabs with same user
2. Tab 1: Create post
3. Tab 2: Check for new notification badge
4. Wait for polling/subscription to update
5. Manually refresh Tab 2 if needed
6. Verify new notification appears

**Validates**:
- Real-time notification delivery
- Cross-session synchronization
- Polling mechanism
- WebSocket/subscription handling

---

## Key Testing Patterns

### Page Object Model
- **ParentAuthPage**: Login/logout, user authentication
- **FeedPage**: Wall feed navigation and feed operations
- **PostComposerPage**: Post creation

### Assertion Patterns
```typescript
// Check visibility
await expect(element).toBeVisible();

// Check text content
await expect(element).toContainText('text');

// Check count
const count = await elements.count();
expect(count).toBeGreaterThan(0);

// Check URL navigation
expect(page.url()).toContain('/notifications');
```

### Async Handling
- `page.waitForLoadState('networkidle')` - Wait for network requests
- `page.waitForTimeout(ms)` - Controlled delays for async operations
- `.catch(() => false)` - Safe async operations with fallbacks

### Error Handling
- Try/catch in cleanup (afterEach)
- Graceful fallbacks for missing selectors
- isVisible().catch(() => false) pattern

## Test Data

### Test Users
```typescript
TEST_PARENT_EMAIL = 'notif-parent@example.com'
TEST_PARENT_PASSWORD = 'SecurePassword123!'
TEST_CHILD_EMAIL = 'notif-child@example.com'
TEST_CHILD_PASSWORD = 'SecurePassword123!'
```

### Test Posts
- Post 1: "Morning family update - excited about the weekend!"
- Post 2: "Just returned from grocery shopping"
- Post 3: "Beautiful sunset photo at the park"

### Test Replies
- Reply 1: "That sounds great! Count me in!"
- Reply 2: "Thanks for the update!"
- Reply 3: "I enjoyed that too!"

## Running Tests

### All Notification Tests
```bash
npx playwright test tests/e2e/notifications.spec.ts
```

### Specific Test
```bash
npx playwright test tests/e2e/notifications.spec.ts -g "Receive Notification on Isla Update"
```

### With UI Mode
```bash
npx playwright test tests/e2e/notifications.spec.ts --ui
```

### Debug Mode
```bash
npx playwright test tests/e2e/notifications.spec.ts --debug
```

## Test Output

Tests generate:
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/junit.xml`
- **Screenshots**: On failure in `tests/screenshots/`
- **Videos**: On failure in `test-results/`

## Selector Strategy

### Primary Selectors
```typescript
// Notification bell
'[aria-label="Notifications"]'

// Unread badge
'.bg-amber-500'

// Dropdown
'div[class*="right-0"][class*="mt-2"][class*="w-96"]'

// Notifications
'div[class*="border-b"][class*="p-4"]'

// Delete button
'button[aria-label="Delete"]'
```

### Fallback Selectors
- Data attributes: `[data-testid="..."]`
- Role attributes: `[role="tab"]`, `[role="combobox"]`
- Text content: `text=...`
- Class patterns: `[class*="..."]`

## Browser Coverage

Tests run on:
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iOS (iPhone 12), Android (Pixel 5)

## Performance Considerations

- **Timeout**: 60 seconds per test
- **Expect Timeout**: 5 seconds
- **Action Timeout**: 10 seconds
- **Network Idle**: 5 seconds

## Database Consistency

Tests verify:
- Notifications created in database
- Read/unread state persisted
- Deleted notifications removed
- Preferences stored correctly
- Unread counts accurate

## Known Limitations

1. **Digest Testing**: Limited without time manipulation libraries
2. **Real-time Updates**: May not see instant updates without WebSocket/subscription
3. **Email Delivery**: In-app notifications tested, email not verified
4. **User Roles**: Tests use simulated or same-user interactions

## Future Enhancements

- [ ] Parent-child notification testing with separate users
- [ ] WebSocket real-time notification testing
- [ ] Email delivery verification via test email service
- [ ] Notification digest batching verification
- [ ] Performance benchmarks for notification loading
- [ ] Accessibility testing with automated tools
- [ ] Multi-user concurrent notification testing

## Common Issues

### Selector Not Found
- Verify element exists in DOM
- Check for dynamic class names
- Use more specific or broader selectors

### Timeout Failures
- Increase timeout in specific assertions
- Add more waitForLoadState calls
- Check network tab for slow requests

### Flaky Tests
- Add longer delays for async operations
- Verify test data is created before assertions
- Use waitForLoadState instead of fixed delays

## Integration with CI/CD

- Tests run on push to main branches
- Retries enabled on CI (1 retry)
- Parallel execution (3 workers locally, 1 on CI)
- Full test reports generated

## Documentation

- See `NOTIFICATIONS_PREFERENCES_IMPLEMENTATION.md` for preference system details
- See `REPLY_NOTIFICATIONS_IMPLEMENTATION.md` for reply notifications
- See `PLAYWRIGHT_SETUP.md` for Playwright configuration

## Support

For test failures or issues:
1. Check test-results/ for error details
2. Review playwright-report/ HTML report
3. Check browser/server logs
4. Run with `--debug` flag for step-by-step debugging
