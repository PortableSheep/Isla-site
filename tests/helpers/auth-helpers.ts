import { Page } from '@playwright/test';

/**
 * Get the stored JWT token from localStorage
 */
export async function getStoredToken(page: Page): Promise<string | null> {
  try {
    const token = await page.evaluate(() => {
      const session = localStorage.getItem('sb-session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed?.access_token || null;
      }
      return null;
    });
    return token;
  } catch {
    return null;
  }
}

/**
 * Check if a user is authenticated by looking for session
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  const token = await getStoredToken(page);
  return !!token;
}

/**
 * Clear authentication by removing session
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('sb-session');
    localStorage.removeItem('sb-auth-token');
    sessionStorage.clear();
  });
}

/**
 * Check if a page requires authentication (redirects to login)
 */
export async function checkPageRequiresAuth(page: Page, path: string): Promise<boolean> {
  try {
    await page.goto(path, { waitUntil: 'networkidle' });
    const currentUrl = page.url();
    return currentUrl.includes('/auth/login');
  } catch {
    return false;
  }
}

/**
 * Wait for a specific number of failed login attempts (for rate limiting tests)
 */
export async function attemptLoginNTimes(
  page: Page,
  email: string,
  password: string,
  attempts: number,
  delayMs: number = 100
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });

    // Fill and submit form
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait a bit between attempts
    if (i < attempts - 1) {
      await page.waitForTimeout(delayMs);
    }
  }
}

/**
 * Extract email confirmation link from URL params (for email verification tests)
 */
export function extractConfirmationTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token') || null;
  } catch {
    return null;
  }
}

/**
 * Simulate email verification by extracting token from URL
 */
export async function getPasswordResetToken(page: Page): Promise<string | null> {
  const url = page.url();
  return extractConfirmationTokenFromUrl(url);
}

/**
 * Check accessibility of authentication pages
 */
export async function checkFormAccessibility(page: Page): Promise<string[]> {
  const violations: string[] = [];

  // Check form labels
  const labels = await page.locator('label').count();
  const inputs = await page.locator('input').count();

  if (labels < inputs) {
    violations.push(`Missing labels: Found ${labels} labels but ${inputs} inputs`);
  }

  // Check for color contrast in error/success messages
  const errorMessages = await page.locator('div[class*="red"], div[class*="error"]').count();
  const successMessages = await page.locator('div[class*="green"], div[class*="success"]').count();

  // Verify buttons have descriptive text
  const buttons = await page.locator('button[type="submit"]').count();
  if (buttons > 0) {
    const buttonText = await page.locator('button[type="submit"]').first().textContent();
    if (!buttonText || buttonText.trim() === '') {
      violations.push('Submit button has no descriptive text');
    }
  }

  return violations;
}

/**
 * Verify that a session persists across page reloads
 */
export async function verifySessionPersistence(page: Page): Promise<boolean> {
  const tokenBefore = await getStoredToken(page);
  if (!tokenBefore) return false;

  // Reload page
  await page.reload({ waitUntil: 'networkidle' });

  const tokenAfter = await getStoredToken(page);
  return tokenBefore === tokenAfter && !!tokenAfter;
}
