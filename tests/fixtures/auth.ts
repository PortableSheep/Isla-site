import { Page, BrowserContext } from '@playwright/test';

/**
 * Log in a test user
 */
export async function loginTestUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/auth/login');

  // Fill in login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit form
  await page.click('button:has-text("Sign In")');

  // Wait for navigation to dashboard or redirect
  await page.waitForURL(/\/(dashboard|protected)/, { timeout: 10000 });
}

/**
 * Log out current user
 */
export async function logoutTestUser(page: Page): Promise<void> {
  // Click on profile/menu button (adjust selector based on actual UI)
  await page.click('[data-testid="user-menu"]');

  // Click logout
  await page.click('button:has-text("Sign Out"), button:has-text("Logout")');

  // Wait for redirect to home or login
  await page.waitForURL(/\/(auth|home|$)/, { timeout: 5000 });
}

/**
 * Sign up a new user
 */
export async function signupTestUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/auth/signup');

  // Fill in signup form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  // Confirm password if field exists
  const confirmPasswordField = await page.$('input[placeholder*="Confirm"]');
  if (confirmPasswordField) {
    await page.fill('input[placeholder*="Confirm"]', password);
  }

  // Submit form
  await page.click('button:has-text("Sign Up"), button:has-text("Create Account")');

  // Wait for confirmation or redirect
  await page.waitForURL(/\/(auth|dashboard|protected)/, { timeout: 10000 });
}

/**
 * Set authentication token in storage
 * Useful for programmatic access without going through UI
 */
export async function setAuthToken(
  context: BrowserContext,
  token: string,
): Promise<void> {
  await context.addInitScript(
    (tokenValue) => {
      const authData = {
        access_token: tokenValue,
        refresh_token: tokenValue,
        expires_in: 3600,
        token_type: 'bearer',
      };
      localStorage.setItem('supabase.auth.token', JSON.stringify(authData));
    },
    token,
  );
}

/**
 * Verify user is logged in by checking for auth indicators
 */
export async function verifyLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we're on a protected page
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      return false;
    }

    // Check for user menu or profile indicators
    const userMenu = await page.$('[data-testid="user-menu"]');
    return !!userMenu;
  } catch {
    return false;
  }
}

/**
 * Verify user is logged out
 */
export async function verifyLoggedOut(page: Page): Promise<boolean> {
  try {
    const currentUrl = page.url();
    // Should be redirected to auth or home
    return currentUrl.includes('/auth') || currentUrl.endsWith('/');
  } catch {
    return false;
  }
}
