import { Page, expect } from '@playwright/test';

/**
 * Wait for element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementHidden(
  page: Page,
  selector: string,
  timeout: number = 5000,
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Click element with retry logic
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  retries: number = 3,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await page.click(selector);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(200);
    }
  }
}

/**
 * Fill input field with retry logic
 */
export async function fillInputWithRetry(
  page: Page,
  selector: string,
  value: string,
  retries: number = 3,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await page.fill(selector, value);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(200);
    }
  }
}

/**
 * Get text content from element
 */
export async function getElementText(
  page: Page,
  selector: string,
): Promise<string> {
  return await page.textContent(selector) || '';
}

/**
 * Check if element is visible
 */
export async function isElementVisible(
  page: Page,
  selector: string,
): Promise<boolean> {
  try {
    const element = await page.$(selector);
    if (!element) return false;
    return await element.isVisible();
  } catch {
    return false;
  }
}

/**
 * Check if element exists in DOM
 */
export async function elementExists(
  page: Page,
  selector: string,
): Promise<boolean> {
  return (await page.$(selector)) !== null;
}

/**
 * Get attribute value
 */
export async function getAttribute(
  page: Page,
  selector: string,
  attributeName: string,
): Promise<string | null> {
  return await page.getAttribute(selector, attributeName);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string,
): Promise<void> {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
  }, selector);
  await page.waitForTimeout(500);
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000,
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  callback: () => Promise<void>,
  timeout: number = 5000,
): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ timeout }),
    callback(),
  ]);
}

/**
 * Dismiss browser dialogs (alerts, confirms, etc.)
 */
export function dismissDialogs(page: Page): void {
  page.on('dialog', (dialog) => {
    dialog.dismiss();
  });
}

/**
 * Accept browser dialogs
 */
export function acceptDialogs(page: Page): void {
  page.on('dialog', (dialog) => {
    dialog.accept();
  });
}

/**
 * Take screenshot
 */
export async function takeScreenshot(
  page: Page,
  name: string,
): Promise<Buffer> {
  return await page.screenshot({
    path: `tests/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Check page for accessibility issues (basic check)
 */
export async function checkAccessibility(page: Page): Promise<void> {
  // Check for common accessibility issues
  const errors: string[] = [];

  // Check for images without alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    errors.push(`Found ${imagesWithoutAlt} images without alt text`);
  }

  // Check for buttons without accessible text or aria-label
  const buttons = await page.locator('button').count();
  for (let i = 0; i < buttons; i++) {
    const button = page.locator('button').nth(i);
    const text = await button.textContent();
    const ariaLabel = await button.getAttribute('aria-label');
    if (!text?.trim() && !ariaLabel) {
      errors.push('Found button without text or aria-label');
      break;
    }
  }

  if (errors.length > 0) {
    console.warn('Accessibility issues found:', errors);
  }
}

/**
 * Wait for specific API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  callback: () => Promise<void>,
  timeout: number = 5000,
): Promise<unknown> {
  const responsePromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout },
  );

  await callback();
  const response = await responsePromise;
  return await response.json();
}

/**
 * Mock API endpoint
 */
export async function mockApiEndpoint(
  page: Page,
  urlPattern: string | RegExp,
  response: unknown,
  status: number = 200,
): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Unmock API endpoint
 */
export async function unmockApiEndpoint(
  page: Page,
  urlPattern: string | RegExp,
): Promise<void> {
  await page.unroute(urlPattern);
}

/**
 * Get all console messages
 */
export async function getConsoleMessages(page: Page): Promise<string[]> {
  const messages: string[] = [];
  page.on('console', (msg) => messages.push(msg.text()));
  return messages;
}

/**
 * Wait for console message
 */
export async function waitForConsoleMessage(
  page: Page,
  text: string,
  timeout: number = 5000,
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const messages = await page.evaluate(() => {
      return (window as unknown as { __consoleLogs?: string[] }).__consoleLogs || [];
    });
    if (messages.some((msg: string) => msg.includes(text))) {
      return;
    }
    await page.waitForTimeout(100);
  }
  throw new Error(`Console message not found: ${text}`);
}

/**
 * Check for JavaScript errors
 */
export function checkForJSErrors(page: Page): void {
  page.on('pageerror', (error) => {
    console.error('JavaScript error:', error);
  });
}
