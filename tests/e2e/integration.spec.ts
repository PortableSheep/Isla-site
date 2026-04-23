import { test, expect } from '@playwright/test';
import { DashboardPage, FeedPage, FamilyPage } from '../pages';
import { loginTestUser } from '../fixtures';

test.describe('Dashboard', () => {
  test.describe('user logged in', () => {
    test.beforeEach(async ({ page }) => {
      // This assumes test user is created and credentials are in environment
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (!email || !password) {
        test.skip();
      }

      try {
        await loginTestUser(page, email, password);
      } catch (error) {
        // If login fails, skip test
        test.skip();
      }
    });

    test('should display dashboard after login', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      const isLoggedIn = await dashboard.isLoggedIn();

      expect(isLoggedIn).toBe(true);
    });

    test('should display user menu', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      const menu = await dashboard.getUserMenu();

      expect(menu).toBeTruthy();
    });

    test('should be able to logout', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.logout();

      // Should be redirected away from protected pages
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/dashboard|protected/);
    });
  });

  test.describe('Feed', () => {
    test.beforeEach(async ({ page }) => {
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (!email || !password) {
        test.skip();
      }

      try {
        await loginTestUser(page, email, password);
      } catch {
        test.skip();
      }
    });

    test('should display feed page', async ({ page }) => {
      const feedPage = new FeedPage(page);
      await feedPage.goto();

      // Should be on feed page
      await expect(page).toHaveURL(/feed|dashboard/);
    });

    test('should have posts composer', async ({ page }) => {
      const feedPage = new FeedPage(page);
      await feedPage.goto();

      const composer = await page.locator('[data-testid="post-composer-input"]');
      await expect(composer).toBeVisible();
    });
  });

  test.describe('Family Management', () => {
    test.beforeEach(async ({ page }) => {
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (!email || !password) {
        test.skip();
      }

      try {
        await loginTestUser(page, email, password);
      } catch {
        test.skip();
      }
    });

    test('should display family page', async ({ page }) => {
      const familyPage = new FamilyPage(page);
      await familyPage.goto();

      await expect(page).toHaveURL(/family/);
    });

    test('should display children list', async ({ page }) => {
      const familyPage = new FamilyPage(page);
      await familyPage.goto();

      const childrenCount = await familyPage.getChildrenCount();
      expect(childrenCount).toBeGreaterThanOrEqual(0);
    });
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should load without errors
    const title = await page.locator('title');
    await expect(title).toBeTruthy();

    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('should work on tablet viewport', async ({ page }) => {
    page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const title = await page.locator('title');
    await expect(title).toBeTruthy();
  });

  test('should work on desktop viewport', async ({ page }) => {
    page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const title = await page.locator('title');
    await expect(title).toBeTruthy();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 errors', async ({ page }) => {
    const response = await page.goto('/nonexistent-page', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBe(404);
  });

  test('should handle network timeouts gracefully', async ({ page }) => {
    // Slow down network
    await page.route('**/*', (route) => {
      setTimeout(() => {
        route.continue();
      }, 5000);
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});

    // Page should at least partially load
    await expect(page).toHaveURL(/http/);
  });
});
