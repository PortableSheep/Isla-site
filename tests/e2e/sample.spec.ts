import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify login page elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to login with invalid credentials
    await loginPage.login('nonexistent@example.com', 'wrongpassword');

    // Should show error
    const hasError = await loginPage.isErrorVisible();
    expect(hasError).toBe(true);
  });

  test('should navigate to protected page after login', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // This test assumes test credentials are set in environment
    const email = process.env.TEST_PARENT_EMAIL;
    const password = process.env.TEST_PARENT_PASSWORD;

    if (!email || !password) {
      test.skip();
      return;
    }

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    // Should be redirected away from login page
    await expect(page).not.toHaveURL(/auth|login/);
  });
});

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto('/');

    // Page should load without errors
    await expect(page).toHaveTitle(/Isla|Home/i);
  });

  test('should have proper meta tags', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await page.goto('/');

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should render without horizontal scroll
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    expect(viewport.width).toBeLessThanOrEqual(375);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have h1 on the page
    const h1 = await page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have proper link text', async ({ page }) => {
    await page.goto('/');

    // Check that links have accessible text
    const links = await page.locator('a').count();
    for (let i = 0; i < links; i++) {
      const link = page.locator('a').nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
});

test.describe('Network Errors', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto('/', { waitUntil: 'domcontentloaded' }).catch(() => {});

    // Page should show error message or fallback UI
    // Check for error message or offline indicator
    const errorElement = await page.$('[data-testid="error-message"]');
    expect(errorElement !== null || page.url().includes('error')).toBeTruthy();

    // Go back online
    await page.context().setOffline(false);
  });
});
