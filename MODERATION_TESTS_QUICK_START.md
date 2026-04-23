# Moderation E2E Tests - Quick Start Guide

## 📁 Files Created

1. **tests/e2e/moderation.spec.ts** (32KB)
   - 14 comprehensive E2E tests for moderation and safety
   - 9 main moderation workflow tests
   - 5 permission and notification tests

2. **tests/pages/moderation.page.ts** (11KB)
   - Page Object for moderation dashboard
   - 30+ methods for moderation operations
   - Hide, delete, filter, and manage flagged posts

3. **tests/pages/audit-log.page.ts** (12KB)
   - Page Object for audit logs dashboard
   - 35+ methods for audit log operations
   - Filter, search, sort, and export audit logs

4. **Documentation**
   - MODERATION_E2E_TESTS.md - Full documentation
   - MODERATION_TESTS_SUMMARY.md - Implementation summary
   - MODERATION_TESTS_QUICK_START.md - This file

## 🚀 Quick Start

### Run All Moderation Tests
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts
```

### Run Single Browser (Faster)
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts --project=chromium
```

### Run Specific Test
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts -g "Flag Inappropriate"
```

### View Test Report
```bash
npx playwright show-report
```

## 📋 Test Cases Overview

### Core Moderation Tests (1-9)
| # | Test | Purpose |
|---|------|---------|
| 1 | Flag Inappropriate Post | Users can report posts |
| 2 | View Moderation Queue | Admin dashboard for flagged posts |
| 3 | Hide Post with Reason | Admin can hide content |
| 4 | Delete Post with Reason | Admin can delete content |
| 5 | Suspend User Account | Admin can suspend users |
| 6 | File Appeal Against Suspension | Users can appeal suspensions |
| 7 | Admin Views Audit Logs | Audit trail of all actions |
| 8 | Verify Soft Delete | Data integrity check |
| 9 | Moderation Decision Consistency | Log consistency verification |

### Permission & Safety Tests (10-14)
- Non-admin cannot access moderation queue
- Non-admin cannot access audit logs
- Regular user can flag posts
- Email notification when post hidden
- Email notification when account suspended

## 🔧 Using Page Objects

### ModerationPage Example
```typescript
const modPage = new ModerationPage(page);

// Navigate to moderation queue
await modPage.navigateToModerationQueue();

// Get statistics
const stats = await modPage.getStatistics();
console.log(`Total flags: ${stats.totalFlags}`);

// Hide a post
await modPage.hidePost(0, 'inappropriate', 'Internal note');

// Filter and search
await modPage.filterByReason('spam');
await modPage.searchFlaggedPosts('test');
```

### AuditLogPage Example
```typescript
const auditPage = new AuditLogPage(page);

// Navigate to audit logs
await auditPage.navigateToAuditLogs();

// Get log entries
const entries = await auditPage.getAuditLogEntries(10);

// Filter by date range
await auditPage.filterByDateRange('2024-04-01', '2024-04-30');

// Verify action logged
const logged = await auditPage.verifyActionLogged('delete', postId);
```

## 📊 Test Statistics

- **Total Test Files**: 1
- **Total Tests**: 14
- **Total Lines of Test Code**: 805
- **Page Object Methods**: 65+
- **Test Scenarios**: 20+

## ✅ What's Tested

### Functionality
- ✅ Post flagging and reporting
- ✅ Moderation queue management
- ✅ Post hiding and deletion
- ✅ User account suspension
- ✅ Suspension appeals
- ✅ Audit logging
- ✅ Permission enforcement

### Data Integrity
- ✅ Soft delete verification
- ✅ Audit trail consistency
- ✅ Flag count accuracy

### Security
- ✅ Admin-only access control
- ✅ User permission boundaries
- ✅ Notification delivery

## 🐛 Debugging Failed Tests

### View Screenshots
```bash
# Screenshots are saved to:
test-results/e2e-moderation-*-chromium/test-failed-*.png
```

### View Videos
```bash
# Videos are saved to:
test-results/e2e-moderation-*-chromium/video.webm
```

### View Full Report
```bash
npx playwright show-report
```

### Run Single Test with UI
```bash
npm run test:e2e -- tests/e2e/moderation.spec.ts -g "Hide Post" --ui
```

## 🔐 Test Data

Tests use **dynamic user creation** with timestamps:
- No hardcoded test credentials
- Auto-generated unique emails
- Automatic cleanup via teardown
- Safe for CI/CD environments

## 📝 Common Issues & Solutions

### Issue: Login Timeouts
**Solution**: Ensure dev server is running at http://localhost:3000
```bash
npm run dev
# In another terminal:
npm run test:e2e -- tests/e2e/moderation.spec.ts
```

### Issue: Database Not Found
**Solution**: Configure test Supabase instance in .env.test
```
NEXT_PUBLIC_SUPABASE_URL=https://your-test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: Selector Not Found
**Solution**: Update selectors in page objects to match your UI
- Check app implementation in app/(protected)/admin/
- Update data-testid and class selectors
- Use browser DevTools Inspector

## 📚 Additional Resources

- Full Documentation: [MODERATION_E2E_TESTS.md](./MODERATION_E2E_TESTS.md)
- Implementation Summary: [MODERATION_TESTS_SUMMARY.md](./MODERATION_TESTS_SUMMARY.md)
- Playwright Docs: https://playwright.dev
- Test Best Practices: https://playwright.dev/docs/best-practices

## 🎯 Next Steps

1. **Review Documentation**
   - Read MODERATION_E2E_TESTS.md for detailed test descriptions

2. **Run Tests Locally**
   ```bash
   npm run dev &
   npm run test:e2e -- tests/e2e/moderation.spec.ts
   ```

3. **Customize Selectors**
   - Update page objects if UI elements differ
   - Run specific tests to verify fixes

4. **Integrate with CI/CD**
   - Add test runs to your GitHub Actions workflow
   - Generate reports for each build

5. **Expand Coverage**
   - Add more edge case tests as needed
   - Create additional page objects for new features

## 💡 Tips

- Use `--ui` flag for interactive debugging
- Run with `--debug` for step-by-step execution
- Use `--reporter=html` for detailed reports
- Export logs with `exportLogs()` method
- Combine filters for targeted test runs

## ✨ Features

✅ Comprehensive moderation workflow testing
✅ Page object pattern for maintainability
✅ Dynamic test data generation
✅ Cross-browser support (chromium, firefox, webkit)
✅ Mobile testing support
✅ Detailed failure reporting
✅ Video/screenshot capture
✅ Audit trail verification

---

**Ready to test!** Start with: `npm run test:e2e -- tests/e2e/moderation.spec.ts`
