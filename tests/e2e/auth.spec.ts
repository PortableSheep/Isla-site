import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';
import { loginTestUser, logoutTestUser, verifyLoggedIn, verifyLoggedOut } from '../fixtures/auth';

/**
 * Authentication E2E Tests
 * 
 * Test suite covering:
 * - Login flow
 * - Logout flow
 * - Session management
 * - Form validation
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication before each test
    await page.context().clearCookies();
  });

  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Verify form elements are visible
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button:has-text("Sign In")');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
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

    test('should navigate to protected page after successful login', async ({ page }) => {
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

      // Verify logged in
      const isLoggedIn = await verifyLoggedIn(page);
      expect(isLoggedIn).toBe(true);
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (email && password) {
        try {
          await loginTestUser(page, email, password);
        } catch {
          // Skip if login fails
          test.skip();
        }
      }
    });

    test('should logout user successfully', async ({ page }) => {
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (!email || !password) {
        test.skip();
        return;
      }

      // Verify logged in before logout
      const isLoggedInBefore = await verifyLoggedIn(page);
      expect(isLoggedInBefore).toBe(true);

      // Logout
      await logoutTestUser(page);

      // Verify logged out
      const isLoggedOut = await verifyLoggedOut(page);
      expect(isLoggedOut).toBe(true);
    });

    test('should redirect to login after logout', async ({ page }) => {
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (!email || !password) {
        test.skip();
        return;
      }

      // Logout
      await logoutTestUser(page);

      // Should be redirected to auth or home page
      const url = page.url();
      const isAuthPage = url.includes('/auth') || url.endsWith('/');
      expect(isAuthPage).toBe(true);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session after page reload', async ({ page }) => {
      const email = process.env.TEST_PARENT_EMAIL;
      const password = process.env.TEST_PARENT_PASSWORD;

      if (!email || !password) {
        test.skip();
        return;
      }

      // Login
      await loginTestUser(page, email, password);

      // Verify logged in
      let isLoggedIn = await verifyLoggedIn(page);
      expect(isLoggedIn).toBe(true);

      // Reload page
      await page.reload();

      // Verify still logged in after reload
      isLoggedIn = await verifyLoggedIn(page);
      expect(isLoggedIn).toBe(true);
    });

    test('should not allow access to protected pages when logged out', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {});

      // Should redirect to auth or login page
      const url = page.url();
      const isAuthPage = url.includes('/auth') || url.includes('login');
      expect(isAuthPage).toBe(true);
    });
  });
});
