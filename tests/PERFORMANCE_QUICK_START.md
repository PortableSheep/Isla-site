# Performance Tests - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### 1. Prerequisites
- Node.js and npm installed
- `.env.test` configured with test credentials
- Application running on `http://localhost:3000`

### 2. Run Tests
```bash
npm run test:e2e tests/performance.spec.ts
```

### 3. View Results
- **JSON Reports**: `test-results/performance/`
- **HTML Report**: Open `test-results/performance/performance-report.html`

---

## 📋 Test Quick Reference

| Test | Time | Category |
|------|------|----------|
| Load Pages (5) | 3s each | Page Load Baseline |
| API Endpoints (2) | 500ms avg | Response Time |
| Notifications (2) | 2s | Bulk Handling |
| Feed Pagination (1) | 1s per page | Pagination |
| Memory (1) | <50MB growth | Leak Detection |
| Stress (2) | Graceful | Error Handling |
| Concurrent (1) | 5s | 5 Users |
| Search/Filter (2) | 1s | Performance |

**Total: 16 tests × 5 browsers = 80 test runs**

---

## 🎯 Common Tasks

### Run Specific Test
```bash
npx playwright test tests/performance.spec.ts -g "Page Load"
```

### Run in Browser (watch)
```bash
npm run test:e2e:ui tests/performance.spec.ts
```

### Generate Summary Report
```bash
npx ts-node scripts/generate-performance-summary.ts
```

### Run Single Browser
```bash
npx playwright test tests/performance.spec.ts --project=chromium
```

---

## 📊 Understanding Results

### Good Performance (✅)
- Page loads: 1.2s - 2.5s
- API responses: 200ms - 400ms
- Memory increase: 10MB - 30MB

### Warning Performance (⚠️)
- Page loads: 2.5s - 3.0s
- API responses: 400ms - 800ms
- Memory increase: 30MB - 50MB

### Bad Performance (❌)
- Page loads: > 3s
- API responses: > 1s
- Memory increase: > 50MB
- Crashes or errors

---

## 🔧 Setup Requirements

### .env.test
```env
BASE_URL=http://localhost:3000
TEST_PARENT_EMAIL=test@example.com
TEST_PARENT_PASSWORD=password123
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

### Start Application
```bash
npm run dev
```

---

## 📝 Test Details

### 1. Page Load Times
- Login, Dashboard, Wall, Notifications, Settings
- Measures: load time, interactive time, FCP
- Threshold: < 3 seconds

### 2. API Response
- GET /api/posts, /api/notifications, /api/families
- POST /api/posts/create
- Threshold: avg < 500ms, p95 < 1000ms

### 3. Notifications
- Loads 50+ notifications
- Tests pagination performance
- Threshold: < 2 seconds

### 4. Feed Pagination
- Tests "Load More" button
- Multiple pagination clicks
- Threshold: < 1s per pagination

### 5. Memory Leak Detection
- Navigate 12 pages (3 × 4 pages)
- Measure memory before/after
- Threshold: < 50MB increase

### 6. Stress Testing
- Network slowdown (2G)
- Offline mode
- Verifies graceful handling

### 7. Concurrent Users
- 5 users performing different actions
- Simultaneous operations
- Threshold: < 5 seconds

### 8. Search/Filter
- Search input performance
- Filter button performance
- Threshold: < 1 second

---

## 📊 Report Files

### Generated Automatically
```
test-results/performance/
├── performance-report.json          # Master report
├── performance-report.html          # Visual report
├── page-load-login-{timestamp}.json
├── api-response-times-{timestamp}.json
├── memory-usage-{timestamp}.json
└── ...
```

### Report Format
```json
{
  "testName": "page-load-login",
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": {
    "loadTime": 1250,
    "timeToInteractive": 800
  }
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase in playwright.config.ts |
| No reports | Check `test-results/` directory exists |
| Login fails | Verify TEST_PARENT_EMAIL/PASSWORD |
| API errors | Verify BASE_URL and network |
| Memory issues | Close other apps, try again |

---

## 📚 More Information

- **Full Docs**: `tests/PERFORMANCE_TESTS_README.md`
- **Summary**: `PERFORMANCE_TEST_SUMMARY.md`
- **Playwright**: https://playwright.dev/

---

## ✅ Quick Checklist

- [ ] Read this guide (you are here!)
- [ ] Check `.env.test` is configured
- [ ] Start application: `npm run dev`
- [ ] Run tests: `npm run test:e2e tests/performance.spec.ts`
- [ ] Check reports: `test-results/performance/`
- [ ] Review results in HTML report
- [ ] Share results with team

---

## 🎓 Learning Path

1. **Start Here** ← You are here
2. Read `tests/PERFORMANCE_TESTS_README.md`
3. Run a single test category
4. Review JSON reports
5. Check HTML visualization
6. Compare with baselines
7. Integrate into CI/CD

---

**Happy Performance Testing! 🚀**
