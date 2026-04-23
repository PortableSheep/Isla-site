# Moderation and Safety E2E Tests

Comprehensive end-to-end tests for moderation and safety features in Isla.site.

## Test File Location
- **Main test file**: `tests/e2e/moderation.spec.ts`
- **Page objects**: 
  - `tests/pages/moderation.page.ts` - ModerationPage class
  - `tests/pages/audit-log.page.ts` - AuditLogPage class

## Test Overview

### Main Test Suite: Moderation and Safety E2E Tests (9 tests)

#### 1. Flag Inappropriate Post
- **Purpose**: Verify users can flag and report inappropriate posts
- **Steps**:
  - Login as parent/child
  - View wall with posts
  - Click "Flag/Report" on a post
  - Select reason (inappropriate, harmful, spam, bullying, other)
  - Add optional comment
  - Submit and verify success message
  - Verify post is marked as flagged
- **Verifications**:
  - Flag form submits successfully
  - Success message appears
  - Post shows flagged status

#### 2. View Moderation Queue
- **Purpose**: Verify admin can access and view moderation queue
- **Steps**:
  - Login as admin
  - Navigate to `/admin/moderation`
  - Verify page loads and shows flagged posts
  - Check flag count visible
  - Verify flagging reasons displayed
  - Verify action buttons available (hide, delete, dismiss)
- **Verifications**:
  - Moderation page accessible to admin
  - Flagged posts list displayed
  - Flag statistics visible
  - Action buttons present and functional

#### 3. Hide Post with Reason
- **Purpose**: Verify admin can hide posts with proper reasoning
- **Steps**:
  - Login as admin
  - Navigate to moderation queue
  - Click "Hide Post" button
  - Select reason (inappropriate, spam, safety, etc.)
  - Add optional internal note
  - Submit and verify success
  - Logout and verify post not visible to regular users
  - Verify "Content hidden" message shown
- **Verifications**:
  - Post hidden successfully
  - Success message appears
  - Non-admin users see hidden content placeholder
  - Audit log entry created

#### 4. Delete Post with Reason
- **Purpose**: Verify admin can permanently delete posts
- **Steps**:
  - Login as admin
  - Navigate to moderation queue
  - Click "Delete Post" button
  - Select reason
  - Add optional internal note
  - Submit and verify success
  - Verify post removed from feed
  - Verify audit log entry created
- **Verifications**:
  - Post deleted successfully
  - Deleted post not visible in UI
  - Flag count decreases
  - Audit log shows delete action

#### 5. Suspend User Account
- **Purpose**: Verify admin can suspend user accounts
- **Steps**:
  - Login as admin
  - Navigate to `/admin/users`
  - Find user to suspend
  - Click "Suspend Account"
  - Select reason (harassment, safety, policy violation)
  - Set duration (temporary or permanent)
  - Submit and verify suspension confirmed
  - Try to login as suspended user
  - Verify suspended user cannot access
  - Verify previous posts hidden
- **Verifications**:
  - Suspension successful
  - Suspended user cannot login
  - Previous posts hidden from public
  - Audit log entry created

#### 6. File Appeal Against Suspension
- **Purpose**: Verify suspended users can appeal and admins receive appeals
- **Steps**:
  - Suspend a user temporarily
  - Login as suspended user
  - Navigate to account/suspension notice
  - Click "Appeal" button
  - Write appeal message
  - Submit appeal
  - Verify success message
  - Login as admin and verify appeal in queue
- **Verifications**:
  - Appeal submitted successfully
  - Appeal visible in admin appeals queue
  - Appeal has timestamp and user info

#### 7. Admin Views Audit Logs
- **Purpose**: Verify admin can access and filter audit logs
- **Steps**:
  - Login as admin
  - Navigate to `/admin/audit-logs`
  - Verify log table loads
  - Check log columns: timestamp, action, user, details
  - Filter by action type (hide, delete, suspend)
  - Filter by date range (last 30 days)
  - Verify logs updated after actions
  - Export audit report (CSV/JSON)
- **Verifications**:
  - Audit logs page accessible
  - All action logs present
  - Filters work correctly
  - Pagination functional
  - Export feature works

#### 8. Verify Soft Delete (Data Integrity)
- **Purpose**: Verify posts are soft-deleted (not hard deleted)
- **Steps**:
  - Create post as parent
  - Login as admin
  - Navigate to moderation queue
  - Delete the post
  - Verify post not visible in UI
  - Query database to verify post exists with `deleted_at` timestamp
- **Verifications**:
  - Post not visible in UI
  - Post still exists in database
  - Post has `deleted_at` timestamp
  - No data loss

#### 9. Moderation Decision Consistency
- **Purpose**: Verify all moderation decisions are logged consistently
- **Steps**:
  - Flag multiple posts with different reasons
  - Admin performs various actions (hide some, delete others)
  - Verify all decisions logged in audit trail
  - Check audit logs show action, admin, timestamp, resource
- **Verifications**:
  - All actions logged
  - Logs are consistent
  - Each log has required fields

### Permission Verification Tests (3 tests)

#### Non-admin cannot access moderation queue
- Verify non-admin users redirected from `/admin/moderation`
- Verify 401/403 response or redirect

#### Non-admin cannot access audit logs
- Verify non-admin users redirected from `/admin/audit-logs`
- Verify 401/403 response or redirect

#### Regular user can flag posts
- Verify flag button visible to regular users
- Verify flag form accessible and functional

### Email Notifications Tests (2 tests)

#### Email notification sent when post is hidden
- Verify notification queued/sent when post hidden
- Verify notification API accessible

#### Email notification sent when account suspended
- Verify notification queued/sent when user suspended
- Verify suspension notification API accessible

## Page Objects

### ModerationPage
Located in `tests/pages/moderation.page.ts`

**Key Methods:**
- `navigateToModerationQueue()` - Go to moderation dashboard
- `getFlaggedPostCount()` - Get number of flagged posts
- `hidePost(index, reason, note?)` - Hide a post with reason
- `deletePost(index, reason, note?)` - Delete a post with reason
- `filterByReason(reason)` - Filter posts by flag reason
- `filterByStatus(status)` - Filter by status (pending/reviewed/dismissed)
- `getStatistics()` - Get moderation statistics
- `exportModerationReport(format)` - Export moderation report

### AuditLogPage
Located in `tests/pages/audit-log.page.ts`

**Key Methods:**
- `navigateToAuditLogs()` - Go to audit logs dashboard
- `getAuditLogCount()` - Get total log entries
- `filterByAction(action)` - Filter by action type
- `filterByDateRange(start, end)` - Filter by date range
- `filterByUser(email)` - Filter by user
- `searchLogs(query)` - Search log entries
- `sortByColumn(column)` - Sort by column
- `exportLogs(format)` - Export audit logs

## Running the Tests

### Run all moderation tests
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts
```

### Run with specific browser
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts --project=chromium
```

### Run specific test
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts -g "Flag Inappropriate Post"
```

### Run with UI mode (interactive debugging)
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts --ui
```

### Generate HTML report
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts
npx playwright show-report
```

## Test Data

Tests use dynamic user creation with timestamps to avoid conflicts:
- Test users created on-demand with unique emails
- Test families and posts created during test execution
- Data cleaned up via global teardown

Environment variables (optional):
- `TEST_ADMIN_EMAIL` - Admin email for testing
- `TEST_ADMIN_PASSWORD` - Admin password
- `TEST_PARENT_EMAIL` - Parent email for testing
- `TEST_PARENT_PASSWORD` - Parent password

## Assertions

Tests verify:
- ✅ UI elements visible and interactive
- ✅ Forms submit successfully
- ✅ Success messages displayed
- ✅ Data persisted correctly
- ✅ Permissions enforced
- ✅ Audit trail recorded
- ✅ Email notifications queued
- ✅ Soft deletes in database

## Dependencies

- **Framework**: Playwright Test
- **Assertion**: Playwright expect
- **Pages**: 
  - ParentAuthPage (existing)
  - FamilyManagementPage (existing)
  - ModerationPage (new)
  - AuditLogPage (new)

## Known Limitations

1. Tests assume app running at `http://localhost:3000`
2. Email verification is mocked (no actual emails sent)
3. Database verification requires test database access
4. Some tests may need UI selector adjustments based on actual implementation

## Future Improvements

- [ ] Add bulk moderation actions (hide/delete multiple posts)
- [ ] Add test for moderation appeals workflow
- [ ] Add performance tests for large moderation queues
- [ ] Add tests for moderation notifications (email, in-app)
- [ ] Add tests for moderator role (vs admin)
- [ ] Add database-level verification helpers
- [ ] Add API integration tests alongside UI tests
