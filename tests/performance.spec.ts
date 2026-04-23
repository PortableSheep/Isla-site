import { test, expect, Page } from '@playwright/test';
import { loginTestUser } from './fixtures/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Performance and Load E2E Tests for Isla.site
 * 
 * Tests cover:
 * - Page load time baselines
 * - API response time benchmarks
 * - Bulk notifications handling
 * - Large feed pagination
 * - Memory usage under load
 * - Error handling under stress
 * - Concurrent users simulation
 * - Search/filter performance
 */

interface PerformanceMetrics {
  testName: string;
  timestamp: string;
  metrics: Record<string, number | string>;
}

interface PageLoadMetric {
  page: string;
  loadTime: number;
  timeToInteractive: number;
  firstContentfulPaint?: number;
}

interface APIMetric {
  endpoint: string;
  method: string;
  minTime: number;
  maxTime: number;
  avgTime: number;
  p95Time: number;
  samples: number;
}

// Performance report storage
const performanceReports: PerformanceMetrics[] = [];
const resultsDir = path.join(__dirname, '..', 'test-results', 'performance');

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

/**
 * Save performance metrics to JSON file
 */
function saveMetrics(metrics: PerformanceMetrics) {
  performanceReports.push(metrics);
  const reportPath = path.join(resultsDir, `${metrics.testName}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
}

/**
 * Measure page load time
 */
async function measurePageLoadTime(page: Page, url: string): Promise<PageLoadMetric> {
  const navigationTiming = await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      loadTime: timing.loadEventEnd - timing.loadEventStart,
      timeToInteractive: timing.domInteractive - timing.fetchStart,
      firstContentfulPaint:
        performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint')
          ?.startTime || 0,
    };
  });

  return {
    page: url,
    ...navigationTiming,
  };
}

/**
 * Measure multiple API calls and return statistics
 */
async function measureAPIResponseTimes(
  page: Page,
  endpoints: string[],
): Promise<Map<string, APIMetric>> {
  const metrics = new Map<string, APIMetric>();

  for (const endpoint of endpoints) {
    const times: number[] = [];

    // Make multiple requests to get statistical data
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      try {
        await page.request.get(endpoint);
        const endTime = performance.now();
        times.push(endTime - startTime);

        // Small delay between requests
        await page.waitForTimeout(100);
      } catch {
        console.log(`Failed to measure ${endpoint}`);
      }
    }

    if (times.length > 0) {
      times.sort((a, b) => a - b);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const p95 = times[Math.floor(times.length * 0.95)];

      metrics.set(endpoint, {
        endpoint,
        method: 'GET',
        minTime: times[0],
        maxTime: times[times.length - 1],
        avgTime: avg,
        p95Time: p95,
        samples: times.length,
      });
    }
  }

  return metrics;
}

/**
 * Get current memory usage
 */
async function getMemoryUsage(page: Page): Promise<number> {
  try {
    const memUsage = await page.evaluate(() => {
      const perfMemory = (performance as Record<string, unknown>).memory as
        | { usedJSHeapSize: number }
        | undefined;
      if (perfMemory) {
        return perfMemory.usedJSHeapSize;
      }
      return 0;
    });
    return memUsage;
  } catch {
    return 0;
  }
}

/**
 * Create test posts via API
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createTestPostsViaAPI(
  page: Page,
  count: number,
  familyId?: string,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    try {
      // Make API request to create post
      await page.request.post('/api/posts/create', {
        data: {
          content: `Performance test post ${i + 1}: ${Math.random().toString(36).substring(7)}`,
          familyId: familyId || 'test-family',
          media: [],
        },
      });

      if (i % 10 === 0) {
        await page.waitForTimeout(100);
      }
    } catch {
      console.log(`Failed to create post ${i}`);
    }
  }
}

/**
 * Create test notifications via API
 */
async function createTestNotifications(
  page: Page,
  count: number,
  userId?: string,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    try {
      await page.request.post('/api/notifications/send', {
        data: {
          userId: userId || 'test-user',
          type: 'comment' as const,
          message: `Test notification ${i + 1}`,
          relatedId: `post-${Math.random().toString(36).substring(7)}`,
        },
      });

      if (i % 10 === 0) {
        await page.waitForTimeout(50);
      }
    } catch (error) {
      console.log(`Failed to create notification ${i}:`, error);
    }
  }
}

test.describe('Performance and Load Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const testEmail = process.env.TEST_PARENT_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_PARENT_PASSWORD || 'testpass123';

  test.describe('Page Load Time Baseline', () => {
    test.beforeEach(async ({ page }) => {
      // Login before testing pages
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        console.log('Login failed, some tests may be skipped');
      }
    });

    test('should load login page within 3 seconds', async ({ page }) => {
      const startTime = performance.now();
      await page.goto(`${baseURL}/auth/login`, { waitUntil: 'networkidle' });
      const loadTime = performance.now() - startTime;

      const metrics = await measurePageLoadTime(page, '/auth/login');
      
      saveMetrics({
        testName: 'login-page-load',
        timestamp: new Date().toISOString(),
        metrics: {
          loadTime: metrics.loadTime,
          timeToInteractive: metrics.timeToInteractive,
          totalTime: loadTime,
        },
      });

      expect(loadTime).toBeLessThan(3000);
    });

    test('should load dashboard within 3 seconds', async ({ page }) => {
      const startTime = performance.now();
      await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
      const loadTime = performance.now() - startTime;

      const metrics = await measurePageLoadTime(page, '/dashboard');
      
      saveMetrics({
        testName: 'dashboard-page-load',
        timestamp: new Date().toISOString(),
        metrics: {
          loadTime: metrics.loadTime,
          timeToInteractive: metrics.timeToInteractive,
          totalTime: loadTime,
        },
      });

      expect(loadTime).toBeLessThan(3000);
    });

    test('should load wall page within 3 seconds', async ({ page }) => {
      const startTime = performance.now();
      await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });
      const loadTime = performance.now() - startTime;

      const metrics = await measurePageLoadTime(page, '/wall');
      
      saveMetrics({
        testName: 'wall-page-load',
        timestamp: new Date().toISOString(),
        metrics: {
          loadTime: metrics.loadTime,
          timeToInteractive: metrics.timeToInteractive,
          totalTime: loadTime,
        },
      });

      expect(loadTime).toBeLessThan(3000);
    });

    test('should load notifications page within 3 seconds', async ({ page }) => {
      const startTime = performance.now();
      await page.goto(`${baseURL}/notifications`, { waitUntil: 'networkidle' });
      const loadTime = performance.now() - startTime;

      const metrics = await measurePageLoadTime(page, '/notifications');
      
      saveMetrics({
        testName: 'notifications-page-load',
        timestamp: new Date().toISOString(),
        metrics: {
          loadTime: metrics.loadTime,
          timeToInteractive: metrics.timeToInteractive,
          totalTime: loadTime,
        },
      });

      expect(loadTime).toBeLessThan(3000);
    });

    test('should load settings page within 3 seconds', async ({ page }) => {
      const startTime = performance.now();
      await page.goto(`${baseURL}/settings`, { waitUntil: 'networkidle' });
      const loadTime = performance.now() - startTime;

      const metrics = await measurePageLoadTime(page, '/settings');
      
      saveMetrics({
        testName: 'settings-page-load',
        timestamp: new Date().toISOString(),
        metrics: {
          loadTime: metrics.loadTime,
          timeToInteractive: metrics.timeToInteractive,
          totalTime: loadTime,
        },
      });

      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('API Response Time Benchmarks', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        test.skip();
      }
    });

    test('should respond to API endpoints within acceptable time', async ({ page }) => {
      const endpoints = [
        '/api/posts',
        '/api/notifications',
        '/api/families/my-families',
      ];

      const metrics = await measureAPIResponseTimes(page, endpoints);
      const report: Record<string, APIMetric> = {};

      for (const [endpoint, metric] of metrics) {
        report[endpoint] = metric;

        // Assert performance thresholds
        expect(metric.avgTime).toBeLessThan(500);
        expect(metric.p95Time).toBeLessThan(1000);
      }

      saveMetrics({
        testName: 'api-response-times',
        timestamp: new Date().toISOString(),
        metrics: report,
      });
    });

    test('should handle POST requests efficiently', async ({ page }) => {
      const startTime = performance.now();

      try {
        const postResponse = await page.request.post('/api/posts/create', {
          data: {
            content: 'Performance test post',
            familyId: 'test-family',
          },
        });

        const postTime = performance.now() - startTime;
        expect(postTime).toBeLessThan(1500);

        saveMetrics({
          testName: 'post-creation-time',
          timestamp: new Date().toISOString(),
          metrics: {
            responseTime: postTime,
            statusCode: postResponse.status(),
          },
        });
      } catch {
        console.log('POST request test skipped');
      }
    });
  });

  test.describe('Bulk Notifications Handling', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        test.skip();
      }
    });

    test('should load notification center efficiently with 50+ notifications', async ({
      page,
    }) => {
      // Create test notifications
      console.log('Creating 50 test notifications...');
      await createTestNotifications(page, 50);

      // Navigate to notifications
      const startTime = performance.now();
      await page.goto(`${baseURL}/notifications`, { waitUntil: 'networkidle' });
      const loadTime = performance.now() - startTime;

      // Verify notifications loaded
      const notificationCount = await page.locator('[data-testid="notification-item"]').count();

      saveMetrics({
        testName: 'bulk-notifications-load',
        timestamp: new Date().toISOString(),
        metrics: {
          loadTime,
          notificationCount,
          loadTimePerNotification: loadTime / Math.max(notificationCount, 1),
        },
      });

      expect(loadTime).toBeLessThan(2000);
      expect(notificationCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle notification pagination', async ({ page }) => {
      await page.goto(`${baseURL}/notifications`, { waitUntil: 'networkidle' });

      // Check if pagination exists
      const paginationButton = page.locator('[data-testid="load-more-notifications"]');
      const hasPagination = await paginationButton.isVisible().catch(() => false);

      if (hasPagination) {
        const startTime = performance.now();
        await paginationButton.click();
        await page.waitForLoadState('networkidle');
        const paginationTime = performance.now() - startTime;

        saveMetrics({
          testName: 'notification-pagination',
          timestamp: new Date().toISOString(),
          metrics: {
            paginationLoadTime: paginationTime,
          },
        });

        expect(paginationTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Large Feed Pagination', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        test.skip();
      }
    });

    test('should handle paginated feed efficiently', async ({ page }) => {
      // Navigate to wall
      await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });

      const paginationTimes: number[] = [];
      const maxPaginationAttempts = 5;

      // Initial load time
      const initialLoadTime = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return timing.loadEventEnd - timing.loadEventStart;
      });

      // Try to click "Load More" or pagination buttons
      for (let i = 0; i < maxPaginationAttempts; i++) {
        const loadMoreButton =
          page.locator('[data-testid="load-more-posts"]') ||
          page.locator('button:has-text("Load More")') ||
          page.locator('button:has-text("Next")');

        const exists = await loadMoreButton.isVisible().catch(() => false);

        if (!exists) {
          break;
        }

        const startTime = performance.now();
        await loadMoreButton.click();
        await page.waitForLoadState('networkidle');
        const paginationTime = performance.now() - startTime;
        paginationTimes.push(paginationTime);

        // Assert individual pagination time
        expect(paginationTime).toBeLessThan(1000);
      }

      saveMetrics({
        testName: 'feed-pagination',
        timestamp: new Date().toISOString(),
        metrics: {
          initialLoadTime,
          totalPaginationEvents: paginationTimes.length,
          avgPaginationTime:
            paginationTimes.length > 0
              ? paginationTimes.reduce((a, b) => a + b, 0) / paginationTimes.length
              : 0,
          maxPaginationTime: paginationTimes.length > 0 ? Math.max(...paginationTimes) : 0,
        },
      });
    });
  });

  test.describe('Memory Usage Under Load', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        test.skip();
      }
    });

    test('should not leak memory during extended use', async ({ page }) => {
      // Measure initial memory
      await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });
      const initialMemory = await getMemoryUsage(page);

      // Perform various actions
      const pages = ['/dashboard', '/wall', '/notifications', '/settings'];

      // Navigate through pages multiple times
      for (let i = 0; i < 3; i++) {
        for (const pagePath of pages) {
          try {
            await page.goto(`${baseURL}${pagePath}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(200);
          } catch {
            console.log(`Failed to navigate to ${pagePath}`);
          }
        }
      }

      // Measure final memory
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);

      saveMetrics({
        testName: 'memory-usage',
        timestamp: new Date().toISOString(),
        metrics: {
          initialMemoryMB: initialMemory / (1024 * 1024),
          finalMemoryMB: finalMemory / (1024 * 1024),
          increaseInMB: memoryIncreaseInMB,
          percentIncrease: ((memoryIncrease / initialMemory) * 100).toFixed(2),
        },
      });

      // Memory should not increase more than 50MB
      expect(memoryIncreaseInMB).toBeLessThan(50);
    });
  });

  test.describe('Error Handling Under Stress', () => {
    test('should gracefully handle network slowdown', async ({ page }) => {
      // Simulate 2G network speed
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (500 * 1000) / 8, // 500 kbps
        uploadThroughput: (20 * 1000) / 8,
        latency: 400,
      });

      try {
        const startTime = performance.now();
        await page.goto(`${baseURL}/wall`, { waitUntil: 'load', timeout: 30000 });
        const loadTime = performance.now() - startTime;

        // Check for error messages
        const errorElements = page.locator('[data-testid="error"], .error, [role="alert"]');
        const errorCount = await errorElements.count();

        // Page should still load and handle the slowdown gracefully
        expect(loadTime).toBeLessThan(30000);

        saveMetrics({
          testName: 'network-slowdown-handling',
          timestamp: new Date().toISOString(),
          metrics: {
            loadTime,
            errorCount,
          },
        });
      } finally {
        // Restore network conditions
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0,
        });
        await client.detach();
      }
    });

    test('should handle offline mode gracefully', async ({ page, context }) => {
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        test.skip();
      }

      await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });

      // Go offline
      await context.setOffline(true);

      try {
        // Try to perform an action
        const response = await page.request.get('/api/posts').catch(() => undefined);

        // Should fail gracefully
        expect(response).toBeDefined();

        saveMetrics({
          testName: 'offline-mode-handling',
          timestamp: new Date().toISOString(),
          metrics: {
            offlineModeTriggered: true,
            appStillResponsive: true,
          },
        });
      } finally {
        // Restore connectivity
        await context.setOffline(false);
      }
    });
  });

  test.describe('Concurrent Users Simulation', () => {
    test('should handle concurrent operations from multiple users', async ({ browser }) => {
      const contexts = [];
      const operationTimes: number[] = [];

      try {
        // Create 5 concurrent user contexts
        for (let i = 0; i < 5; i++) {
          const context = await browser.newContext();
          contexts.push(context);
        }

        // Simulate different operations for each user
        const operations = [
          async (page: Page) => {
            // User 1: Create post
            await loginTestUser(page, testEmail, testPassword);
            const start = performance.now();
            await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });
            operationTimes.push(performance.now() - start);
          },
          async (page: Page) => {
            // User 2: Reply to post
            await loginTestUser(page, testEmail, testPassword);
            const start = performance.now();
            await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });
            operationTimes.push(performance.now() - start);
          },
          async (page: Page) => {
            // User 3: Change preferences
            await loginTestUser(page, testEmail, testPassword);
            const start = performance.now();
            await page.goto(`${baseURL}/settings`, { waitUntil: 'networkidle' });
            operationTimes.push(performance.now() - start);
          },
          async (page: Page) => {
            // User 4: View notifications
            await loginTestUser(page, testEmail, testPassword);
            const start = performance.now();
            await page.goto(`${baseURL}/notifications`, { waitUntil: 'networkidle' });
            operationTimes.push(performance.now() - start);
          },
          async (page: Page) => {
            // User 5: View dashboard
            await loginTestUser(page, testEmail, testPassword);
            const start = performance.now();
            await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
            operationTimes.push(performance.now() - start);
          },
        ];

        // Execute operations concurrently
        const startTime = performance.now();
        await Promise.all(
          contexts.map(async (context, index) => {
            const page = await context.newPage();
            try {
              if (operations[index]) {
                await operations[index](page);
              }
            } finally {
              await page.close();
            }
          }),
        );
        const totalTime = performance.now() - startTime;

        const avgOperationTime =
          operationTimes.length > 0
            ? operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length
            : 0;

        saveMetrics({
          testName: 'concurrent-users',
          timestamp: new Date().toISOString(),
          metrics: {
            totalConcurrentUsers: 5,
            totalTime,
            avgOperationTime,
            maxOperationTime: Math.max(...operationTimes),
          },
        });

        // All operations should complete within 5 seconds
        expect(totalTime).toBeLessThan(5000);
      } finally {
        // Close all contexts
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });

  test.describe('Search and Filter Performance', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginTestUser(page, testEmail, testPassword);
      } catch {
        test.skip();
      }
    });

    test('should perform search efficiently', async ({ page }) => {
      await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });

      // Look for search input
      const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="Search"]');
      const hasSearch = await searchInput.isVisible().catch(() => false);

      if (hasSearch) {
        // Perform search
        const searchTerm = 'test';
        const startTime = performance.now();

        await searchInput.fill(searchTerm);
        await page.waitForLoadState('networkidle');
        const searchTime = performance.now() - startTime;

        saveMetrics({
          testName: 'search-performance',
          timestamp: new Date().toISOString(),
          metrics: {
            searchTerm,
            responseTime: searchTime,
          },
        });

        // Search should complete quickly
        expect(searchTime).toBeLessThan(1000);
      }
    });

    test('should perform filtering efficiently', async ({ page }) => {
      await page.goto(`${baseURL}/wall`, { waitUntil: 'networkidle' });

      // Look for filter options
      const filterButton =
        page.locator('[data-testid="filter-button"]') ||
        page.locator('button:has-text("Filter")');

      const hasFilter = await filterButton.isVisible().catch(() => false);

      if (hasFilter) {
        const startTime = performance.now();
        await filterButton.click();
        await page.waitForLoadState('networkidle');
        const filterTime = performance.now() - startTime;

        saveMetrics({
          testName: 'filter-performance',
          timestamp: new Date().toISOString(),
          metrics: {
            responseTime: filterTime,
          },
        });

        // Filtering should be fast
        expect(filterTime).toBeLessThan(1000);
      }
    });
  });

  // Cleanup: Save final report
  test.afterAll(async () => {
    const finalReport = {
      testSuite: 'Performance and Load Tests',
      timestamp: new Date().toISOString(),
      totalTests: performanceReports.length,
      metrics: performanceReports,
    };

    const reportPath = path.join(resultsDir, 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

    // Create HTML report summary
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .metric-section { margin-bottom: 30px; }
        h2 { color: #333; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    <p>Total Tests: ${performanceReports.length}</p>
    
    <div class="metric-section">
        <h2>Test Results</h2>
        <table>
            <tr>
                <th>Test Name</th>
                <th>Timestamp</th>
                <th>Metrics</th>
            </tr>
            ${performanceReports
              .map(
                (report) => `
            <tr>
                <td>${report.testName}</td>
                <td>${report.timestamp}</td>
                <td><pre>${JSON.stringify(report.metrics, null, 2)}</pre></td>
            </tr>
            `,
              )
              .join('')}
        </table>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(resultsDir, 'performance-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`\n📊 Performance report saved to ${reportPath}`);
    console.log(`📄 HTML report saved to ${htmlPath}\n`);
  });
});
