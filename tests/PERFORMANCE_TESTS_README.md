# Performance and Load E2E Tests

Comprehensive performance and load testing suite for Isla.site built with Playwright.

## Overview

The performance test suite (`tests/performance.spec.ts`) measures and validates the performance of key application features under various conditions. Tests are designed to identify performance bottlenecks, memory leaks, and ensure consistent user experience.

## Test Categories

### 1. Page Load Time Baseline (5 tests)

Measures the load time for each major page and ensures they load within acceptable thresholds.

**Pages tested:**
- `/auth/login` - Authentication page
- `/dashboard` - Dashboard page
- `/wall` - Social wall/feed
- `/notifications` - Notification center
- `/settings` - User settings page

**Assertions:**
- Each page must load in < 3 seconds
- Records `loadTime`, `timeToInteractive`, and `firstContentfulPaint` metrics

**Metrics collected:**
- Total load time
- Time to interactive
- First contentful paint (FCP)

### 2. API Response Time Benchmarks (2 tests)

Measures response times for key API endpoints and validates they meet performance targets.

**Endpoints tested:**
- `GET /api/posts` - Wall feed
- `GET /api/notifications` - User notifications
- `GET /api/families/my-families` - Family list
- `POST /api/posts/create` - Create new post

**Assertions:**
- Average response time < 500ms
- 95th percentile response time < 1000ms
- Each endpoint tested 5 times for statistical accuracy

**Metrics collected:**
- Min/max/average response times
- 95th percentile response time
- Sample count
- HTTP status code

### 3. Bulk Notifications Handling (2 tests)

Tests performance when displaying large numbers of notifications.

**Scenario:**
- Creates 50+ test notifications
- Navigates to notification center
- Tests pagination performance

**Assertions:**
- Notification center loads in < 2 seconds
- All notifications load and display correctly
- Pagination load time < 2 seconds

**Metrics collected:**
- Initial load time
- Notification count
- Load time per notification
- Pagination load time

### 4. Large Feed Pagination (1 test)

Tests performance when paginating through large feeds.

**Scenario:**
- Navigate to wall/feed
- Click "Load More" pagination button up to 5 times
- Measure pagination load times

**Assertions:**
- Each pagination click loads in < 1 second
- Handles multiple pagination clicks consistently

**Metrics collected:**
- Initial load time
- Individual pagination times
- Average pagination time
- Maximum pagination time
- Total pagination events

### 5. Memory Usage Under Load (1 test)

Monitors memory usage during extended application use to detect memory leaks.

**Scenario:**
- Navigate through multiple pages 3 times
- Perform various actions
- Measure memory before and after

**Assertions:**
- Memory increase < 50MB
- No evidence of memory leaks

**Metrics collected:**
- Initial memory (MB)
- Final memory (MB)
- Memory increase (MB)
- Percentage increase

### 6. Error Handling Under Stress (2 tests)

Tests application resilience under adverse network conditions.

**Tests:**
1. **Network Slowdown** - Simulates 2G network speed
   - Latency: 400ms
   - Download: 500 kbps
   - Upload: 20 kbps

2. **Offline Mode** - Tests offline functionality
   - Goes completely offline
   - Verifies graceful error handling

**Assertions:**
- Application handles slowdown without crashing
- Loads within reasonable time even on slow networks
- Offline mode handled gracefully
- Error messages displayed when appropriate

**Metrics collected:**
- Load time under adverse conditions
- Error count
- App responsiveness status

### 7. Concurrent Users Simulation (1 test)

Simulates 5 concurrent users performing different operations.

**Concurrent operations:**
1. User 1: Navigate to wall
2. User 2: Navigate to wall
3. User 3: Navigate to settings
4. User 4: Navigate to notifications
5. User 5: Navigate to dashboard

**Assertions:**
- All operations complete within 5 seconds
- No data corruption under concurrent access
- Application remains responsive

**Metrics collected:**
- Total concurrent users
- Total operation time
- Average operation time per user
- Maximum operation time

### 8. Search and Filter Performance (2 tests)

Tests search and filtering functionality performance.

**Tests:**
1. **Search** - Tests search input performance
   - Enters search term "test"
   - Measures response time

2. **Filtering** - Tests filter functionality
   - Opens filter menu
   - Measures filter application time

**Assertions:**
- Search responds in < 1 second
- Filtering completes in < 1 second

**Metrics collected:**
- Search/filter response time
- Search term used

## Running Tests

### Run all performance tests
```bash
npm run test:e2e tests/performance.spec.ts
```

### Run performance tests in headed mode (see browser)
```bash
npm run test:e2e:headed tests/performance.spec.ts
```

### Run performance tests in UI mode (interactive)
```bash
npm run test:e2e:ui tests/performance.spec.ts
```

### Run performance tests in debug mode
```bash
npm run test:e2e:debug tests/performance.spec.ts
```

### Run specific test
```bash
npx playwright test tests/performance.spec.ts -g "should load login page"
```

## Performance Reports

Test results are saved to `test-results/performance/` directory:

- **JSON Reports**: Individual test metrics saved as JSON files
  - Format: `{testName}-{timestamp}.json`
  - Contains detailed performance metrics

- **Master Report**: `performance-report.json`
  - Aggregates all test results
  - Contains metadata and summary

- **HTML Report**: `performance-report.html`
  - Visual representation of test results
  - Easy to share and review

### Report Example

```json
{
  "testName": "page-load-login",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "metrics": {
    "loadTime": 1250,
    "timeToInteractive": 800,
    "totalTime": 1250
  }
}
```

## Environment Variables

Required environment variables:
- `BASE_URL`: Application base URL (default: `http://localhost:3000`)
- `TEST_PARENT_EMAIL`: Test user email for authentication
- `TEST_PARENT_PASSWORD`: Test user password
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

Set these in `.env.test`:
```env
BASE_URL=http://localhost:3000
TEST_PARENT_EMAIL=test@example.com
TEST_PARENT_PASSWORD=testpass123
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

## Test Configuration

Performance tests run with the following configuration:

- **Timeout**: 60 seconds per test (increased from default 30s)
- **Parallel**: Disabled for performance tests to ensure consistent results
- **Retries**: 0 on local, 1 on CI
- **Workers**: 1 (to avoid resource contention)

See `playwright.config.ts` for full configuration.

## Performance Baselines

Default performance thresholds:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Page Load | < 3s | All pages |
| API Response (avg) | < 500ms | All endpoints |
| API Response (p95) | < 1000ms | 95th percentile |
| Notification Center | < 2s | With 50+ items |
| Pagination | < 1s | Per pagination click |
| Memory Increase | < 50MB | Extended use |
| Search/Filter | < 1s | Response time |
| Concurrent Ops | < 5s | 5 concurrent users |

These baselines can be adjusted based on deployment environment and hardware specifications.

## CI/CD Integration

Performance tests are included in the E2E test suite. To run in CI:

```bash
npm run test:e2e tests/performance.spec.ts
```

Performance reports are generated in `test-results/performance/` and can be archived as CI artifacts.

### GitHub Actions Example

```yaml
- name: Run performance tests
  run: npm run test:e2e tests/performance.spec.ts

- name: Upload performance reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: performance-reports
    path: test-results/performance/
```

## Interpreting Results

### Good Performance Indicators
- ✅ All page loads < 2s
- ✅ API responses consistently < 300ms
- ✅ Memory stable after extended use
- ✅ Graceful handling of network issues
- ✅ Sub-second search/filter responses

### Warning Signs
- ⚠️ Page loads consistently > 2.5s
- ⚠️ API responses > 700ms
- ⚠️ Memory increase > 30MB
- ⚠️ Inconsistent pagination performance
- ⚠️ Search/filter responses > 800ms

### Critical Issues
- 🔴 Page loads > 3s (failing tests)
- 🔴 API responses > 1s
- 🔴 Memory leak detected (unbounded growth)
- 🔴 Application crash under load
- 🔴 Offline mode not handled

## Best Practices

1. **Run regularly**: Execute performance tests as part of regular CI/CD pipeline
2. **Monitor trends**: Track metrics over time to detect gradual performance degradation
3. **Test realistic data**: Use realistic amounts of test data (50+ notifications, 1000+ posts)
4. **Multiple runs**: Run tests multiple times to account for variability
5. **Clean environment**: Run on consistent hardware/network conditions
6. **Document changes**: Record performance impact of significant code changes

## Troubleshooting

### Tests timing out
- Check network connectivity
- Ensure test user credentials are correct
- Verify application is running on `BASE_URL`
- Increase timeout if running on slow machine

### Memory tests failing
- Other applications may be consuming memory
- Browser cache may be affecting measurements
- Try running in isolation

### API tests failing
- Verify backend services are running
- Check API endpoints exist and are accessible
- Review API error responses in logs

### Concurrent user test failures
- Resource contention on test machine
- Try reducing concurrent user count
- Run on machine with more resources

## Contributing

When adding new performance tests:

1. Use descriptive test names
2. Record metrics to JSON file
3. Include clear assertions with meaningful thresholds
4. Add comments explaining the test scenario
5. Update this README with new test information
6. Verify test passes locally before committing

## Related Documentation

- [E2E Tests README](./E2E_TESTS_README.md)
- [Playwright Documentation](https://playwright.dev/)
- [Performance Testing Best Practices](https://playwright.dev/docs/performance)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Playwright documentation
3. Check test logs and reports
4. Consult team documentation
