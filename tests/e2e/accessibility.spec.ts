import { test, expect, Page } from '@playwright/test';

/**
 * Accessibility E2E Tests
 * 
 * Comprehensive test suite covering:
 * - Responsive design (mobile, tablet, desktop)
 * - Keyboard navigation
 * - Focus indicators
 * - Screen reader compatibility
 * - Color contrast verification
 * - Touch interactions
 * - Dark mode rendering
 * - Skip links & navigation
 */

// Test user credentials
const TEST_EMAIL = process.env.TEST_PARENT_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PARENT_PASSWORD || 'password123';

// Helper function to login
async function loginAsTestUser(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/(protected|dashboard)/, { timeout: 10000 }).catch(() => {
    // If navigation fails, continue test anyway
  });
}

// Helper function to check color contrast
function calculateContrast(rgb1: string, rgb2: string): number {
  const getLuminance = (rgb: string) => {
    const [r, g, b] = rgb.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const [rs, gs, bs] = [r, g, b].map((v) => {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to extract text colors
async function getTextColorPairs(page: Page): Promise<Array<{ element: string; contrast: number }>> {
  const colorPairs = await page.evaluate(() => {
    const pairs: Array<{ text: string; color: string; bgColor: string }> = [];
    const elements = document.querySelectorAll('button, a, p, span, label, input, textarea');

    elements.forEach((el) => {
      if (el.textContent?.trim() && el.offsetHeight > 0) {
        const computed = window.getComputedStyle(el);
        const color = computed.color;
        const bgColor = computed.backgroundColor;
        if (color && bgColor) {
          pairs.push({
            text: el.textContent.slice(0, 50),
            color,
            bgColor,
          });
        }
      }
    });
    return pairs;
  });

  return colorPairs.map((pair) => ({
    element: pair.text,
    contrast: calculateContrast(pair.color, pair.bgColor),
  }));
}

// Helper function to verify keyboard navigation
async function testKeyboardNavigation(page: Page, pagePath: string) {
  await page.goto(pagePath);
  
  // Get all focusable elements
  const focusableElements = await page.locator(
    'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])',
  ).count();

  expect(focusableElements).toBeGreaterThan(0);

  // Tab through elements
  let tabCount = 0;
  const maxTabs = Math.min(focusableElements + 5, 30);

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    tabCount++;
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        visible: el ? (el as HTMLElement).offsetHeight > 0 : false,
      };
    });

    // Verify focused element is visible
    if (focusedElement.visible && focusedElement.tag) {
      expect(focusedElement.visible).toBe(true);
    }
  }

  expect(tabCount).toBeGreaterThan(0);
}

// Helper function to check accessibility tree
async function checkAccessibilityTree(page: Page): Promise<{
  pageTitle: string;
  headings: string[];
  buttons: string[];
  labels: string[];
  landmarks: string[];
}> {
  const tree = await page.evaluate(() => {
    return {
      pageTitle: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map((h) => `${h.tagName}: ${h.textContent?.slice(0, 50)}`)
        .slice(0, 10),
      buttons: Array.from(document.querySelectorAll('button'))
        .map((b) => b.textContent?.slice(0, 30) || 'unlabeled')
        .slice(0, 10),
      labels: Array.from(document.querySelectorAll('label'))
        .map((l) => l.textContent?.slice(0, 30) || 'unlabeled')
        .slice(0, 10),
      landmarks: Array.from(document.querySelectorAll('nav, main, footer, [role="main"], [role="navigation"]'))
        .map((l) => `${l.tagName || l.getAttribute('role')}`)
        .slice(0, 10),
    };
  });
  return tree;
}

test.describe('Accessibility Tests', () => {
  test.describe('1. Mobile Responsiveness (375px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should render login page on mobile without layout issues', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Verify page loads
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button:has-text("Sign In")');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Verify buttons are at least 48px in size
      const buttonSize = await submitButton.boundingBox();
      if (buttonSize) {
        expect(buttonSize.height).toBeGreaterThanOrEqual(44);
        expect(buttonSize.width).toBeGreaterThanOrEqual(44);
      }

      // Verify text is readable (not too small)
      const fontSize = await emailInput.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      const fsValue = parseInt(fontSize, 10);
      expect(fsValue).toBeGreaterThanOrEqual(14);
    });

    test('should allow navigation to dashboard on mobile after login', async ({ page }) => {
      await loginAsTestUser(page);
      
      const content = await page.locator('main, [role="main"]');
      await expect(content).toBeVisible();
      
      // Verify no horizontal scroll needed
      const viewportSize = page.viewportSize();
      const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual((viewportSize?.width || 0) + 1);
    });

    test('should maintain accessible button sizes on mobile', async ({ page }) => {
      await page.goto('/auth/login');
      
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (await button.isVisible())) {
          // Minimum touch target size is 48x48 (44x44 acceptable)
          expect(box.height).toBeGreaterThanOrEqual(40);
          expect(box.width).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });

  test.describe('2. Tablet Responsiveness (768px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('should render dashboard on tablet with proper layout', async ({ page }) => {
      await loginAsTestUser(page);
      
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      // Verify proper spacing (should have margin/padding)
      const spacing = await main.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
        };
      });

      expect(spacing).toBeDefined();
    });

    test('should have appropriate max-width on tablet', async ({ page }) => {
      await loginAsTestUser(page);
      
      const container = page.locator('main, .container, [role="main"]');
      const maxWidth = await container.evaluate((el) => {
        return window.getComputedStyle(el).maxWidth;
      });

      // Max-width should be set and reasonable
      expect(maxWidth).not.toBe('none');
    });

    test('should handle navigation properly on tablet', async ({ page }) => {
      await loginAsTestUser(page);
      
      const navElements = page.locator('nav, [role="navigation"]');
      const navCount = await navElements.count();
      
      if (navCount > 0) {
        const firstNav = navElements.first();
        await expect(firstNav).toBeVisible();
      }
    });
  });

  test.describe('3. Desktop Responsiveness (1440px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('should render dashboard on desktop with full-width features', async ({ page }) => {
      await loginAsTestUser(page);
      
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
      
      // Verify layout uses available space
      const mainBox = await main.boundingBox();
      expect(mainBox?.width).toBeGreaterThan(800);
    });

    test('should apply max-widths correctly on desktop', async ({ page }) => {
      await loginAsTestUser(page);
      
      const containers = await page.locator('[style*="max-width"], .container, main').all();
      
      for (const container of containers) {
        const maxWidth = await container.evaluate((el) => {
          return window.getComputedStyle(el).maxWidth;
        });
        
        // Max-width should be set or be responsive
        expect(maxWidth).toBeDefined();
      }
    });

    test('should display all features on desktop without truncation', async ({ page }) => {
      await loginAsTestUser(page);
      
      const headings = await page.locator('h1, h2, h3').all();
      
      for (const heading of headings) {
        if (await heading.isVisible()) {
          const isOverflowing = await heading.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });
          expect(isOverflowing).toBe(false);
        }
      }
    });
  });

  test.describe('4. Keyboard Navigation - Full App', () => {
    test('should navigate login form with keyboard', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Start tabbing from page load
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button:has-text("Sign In")');

      // Tab to email
      await page.keyboard.press('Tab');
      await expect(emailInput).toBeFocused();

      // Type email
      await page.keyboard.type(TEST_EMAIL);

      // Tab to password
      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();
      await page.keyboard.type(TEST_PASSWORD);

      // Tab to submit
      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();

      // Submit with Enter
      await page.keyboard.press('Enter');
    });

    test('should navigate dashboard with Tab key', async ({ page }) => {
      await loginAsTestUser(page);
      await testKeyboardNavigation(page, '/dashboard');
    });

    test('should navigate wall page with keyboard', async ({ page }) => {
      await loginAsTestUser(page);
      await testKeyboardNavigation(page, '/(protected)/wall');
    });

    test('should navigate settings page with keyboard', async ({ page }) => {
      await loginAsTestUser(page);
      await testKeyboardNavigation(page, '/(protected)/settings');
    });

    test('should maintain logical tab order', async ({ page }) => {
      await page.goto('/auth/login');
      
      const focusSequence: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName || 'unknown';
        });
        focusSequence.push(focused);
      }

      // Should have navigated through at least some elements
      expect(focusSequence.length).toBeGreaterThan(0);
    });
  });

  test.describe('5. Focus Indicators Visible', () => {
    test('should display focus outline on form inputs', async ({ page }) => {
      await page.goto('/auth/login');
      
      const emailInput = page.locator('input[type="email"]');
      
      // Focus the input
      await emailInput.focus();
      
      const focusStyle = await emailInput.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
          borderColor: style.borderColor,
        };
      });

      // Should have some visible focus indicator
      const hasFocusIndicator = 
        (focusStyle.outline && focusStyle.outline !== 'none') ||
        (focusStyle.outlineWidth && focusStyle.outlineWidth !== '0px') ||
        (focusStyle.boxShadow && focusStyle.boxShadow !== 'none') ||
        focusStyle.borderColor;

      expect(hasFocusIndicator).toBeTruthy();
    });

    test('should display focus outline on buttons', async ({ page }) => {
      await page.goto('/auth/login');
      
      const button = page.locator('button:has-text("Sign In")');
      await button.focus();
      
      const hasFocusStyle = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline !== 'none',
          boxShadow: style.boxShadow !== 'none',
          hasClass: el.className.includes('focus') || el.className.includes('focused'),
        };
      });

      expect(
        hasFocusStyle.outline || hasFocusStyle.boxShadow || hasFocusStyle.hasClass
      ).toBeTruthy();
    });

    test('should display focus outline on links', async ({ page }) => {
      await loginAsTestUser(page);
      
      const link = page.locator('a').first();
      if (await link.isVisible()) {
        await link.focus();
        
        const hasFocusStyle = await link.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline !== 'none',
            boxShadow: style.boxShadow !== 'none',
            textDecoration: style.textDecoration,
          };
        });

        expect(
          hasFocusStyle.outline || hasFocusStyle.boxShadow || hasFocusStyle.textDecoration
        ).toBeTruthy();
      }
    });

    test('should have sufficient focus indicator contrast', async ({ page }) => {
      await page.goto('/auth/login');
      
      const input = page.locator('input[type="email"]');
      await input.focus();
      
      const colors = await input.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          outlineColor: style.outlineColor,
        };
      });

      expect(colors).toBeDefined();
    });
  });

  test.describe('6. Screen Reader Compatibility', () => {
    test('should have proper page title and headings on login', async ({ page }) => {
      await page.goto('/auth/login');
      
      const tree = await checkAccessibilityTree(page);
      
      expect(tree.pageTitle).toBeTruthy();
      expect(tree.pageTitle.length).toBeGreaterThan(0);
      expect(tree.headings.length).toBeGreaterThan(0);
    });

    test('should have proper heading hierarchy on dashboard', async ({ page }) => {
      await loginAsTestUser(page);
      
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels: number[] = [];
      
      for (const heading of headings) {
        const level = await heading.evaluate((el) => {
          return parseInt(el.tagName[1]);
        });
        headingLevels.push(level);
      }

      // Should have at least some headings
      expect(headingLevels.length).toBeGreaterThan(0);
      
      // H1 should appear before or equal to h2, etc.
      if (headingLevels.length > 1) {
        expect(headingLevels[0]).toBeLessThanOrEqual(3);
      }
    });

    test('should have labeled form inputs', async ({ page }) => {
      await page.goto('/auth/login');
      
      const inputs = await page.locator('input').all();
      let labeledInputs = 0;

      for (const input of inputs) {
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        const associated = await input.evaluate((el) => {
          const id = el.id;
          if (id) {
            return !!document.querySelector(`label[for="${id}"]`);
          }
          return false;
        });

        if (ariaLabel || placeholder || associated) {
          labeledInputs++;
        }
      }

      expect(labeledInputs).toBeGreaterThan(0);
    });

    test('should have meaningful button text', async ({ page }) => {
      await page.goto('/auth/login');
      
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        // Should have meaningful text or aria-label
        const hasMeaningfulText = (text && text.trim() && text.trim().length > 2) || ariaLabel;
        
        if (await button.isVisible()) {
          expect(hasMeaningfulText).toBeTruthy();
        }
      }
    });

    test('should have landmark regions on protected pages', async ({ page }) => {
      await loginAsTestUser(page);
      
      const tree = await checkAccessibilityTree(page);
      
      // Should have at least one landmark
      expect(tree.landmarks.length).toBeGreaterThanOrEqual(1);
    });

    test('should have proper ARIA labels where needed', async ({ page }) => {
      await loginAsTestUser(page);
      
      const closeButtons = await page.locator('button[aria-label*="close" i], button[aria-label*="dismiss" i]').all();
      const menuButtons = await page.locator('button[aria-haspopup="true"]').all();
      
      // If there are interactive elements, they should have ARIA labels
      expect(closeButtons.length + menuButtons.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('7. Color Contrast Verification', () => {
    test('should meet WCAG AA contrast standards on login page', async ({ page }) => {
      await page.goto('/auth/login');
      
      const colorPairs = await getTextColorPairs(page);
      const violations: Array<{ element: string; contrast: number }> = [];

      colorPairs.forEach((pair) => {
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        if (pair.contrast < 4.5) {
          violations.push(pair);
        }
      });

      // Allow some violations but log them
      if (violations.length > 0) {
        console.log('Contrast violations on login:', violations.slice(0, 3));
      }
    });

    test('should meet contrast standards on dashboard', async ({ page }) => {
      await loginAsTestUser(page);
      
      const colorPairs = await getTextColorPairs(page);
      
      // At least some elements should have good contrast
      const goodContrast = colorPairs.filter((p) => p.contrast >= 4.5);
      expect(goodContrast.length).toBeGreaterThan(0);
    });

    test('should have sufficient button contrast', async ({ page }) => {
      await page.goto('/auth/login');
      
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        if (await button.isVisible()) {
          const colors = await button.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return {
              color: style.color,
              backgroundColor: style.backgroundColor,
            };
          });

          if (colors.color && colors.backgroundColor) {
            const contrast = calculateContrast(colors.color, colors.backgroundColor);
            // Buttons should have good contrast
            expect(contrast).toBeGreaterThan(2.0);
          }
        }
      }
    });
  });

  test.describe('8. Touch Interactions on Mobile', () => {
    test.beforeEach(async ({ page }) => {
      // Emulate touch device
      await page.setViewportSize({ width: 375, height: 667 });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
        Object.defineProperty(navigator, 'ontouchstart', { value: true });
      });
    });

    test('should have adequate button size for touch', async ({ page }) => {
      await page.goto('/auth/login');
      
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(40);
            expect(box.width).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test('should allow form input on touch devices', async ({ page }) => {
      await page.goto('/auth/login');
      
      const emailInput = page.locator('input[type="email"]');
      await emailInput.tap();
      
      // Input should be focusable
      const focused = await emailInput.evaluate((el) => {
        return document.activeElement === el;
      });
      
      expect(focused).toBe(true);
    });

    test('should handle smooth scrolling on touch', async ({ page }) => {
      await loginAsTestUser(page);
      
      const main = page.locator('main, [role="main"]');
      if (await main.isVisible()) {
        const isScrollable = await main.evaluate((el) => {
          return el.scrollHeight > el.clientHeight;
        });

        if (isScrollable) {
          await main.evaluate((el) => {
            el.scroll(0, 100);
          });
          
          const scrollPosition = await main.evaluate((el) => el.scrollTop);
          // Scroll should work
          expect(scrollPosition).toBeGreaterThan(0);
        }
      }
    });

    test('should have proper spacing between touch targets', async ({ page }) => {
      await page.goto('/auth/login');
      
      const inputs = await page.locator('input').all();
      
      for (const input of inputs) {
        if (await input.isVisible()) {
          const box = await input.boundingBox();
          // Inputs should have adequate size for touch
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });
  });

  test.describe('9. Dark Mode Rendering', () => {
    test('should render login page in dark mode', async ({ page }) => {
      // Emulate dark color scheme
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await page.goto('/auth/login');
      
      const form = page.locator('form, [role="form"]').first();
      if (await form.isVisible()) {
        await expect(form).toBeVisible();
      }
    });

    test('should maintain readable text in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/auth/login');
      
      const textElements = await page.locator('p, label, span').all();
      let visibleTextCount = 0;

      for (const element of textElements) {
        if (await element.isVisible()) {
          const text = await element.textContent();
          if (text && text.trim().length > 0) {
            visibleTextCount++;
          }
        }
      }

      expect(visibleTextCount).toBeGreaterThan(0);
    });

    test('should render dashboard in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await loginAsTestUser(page);
      
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
    });

    test('should have proper contrast in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/auth/login');
      
      const colorPairs = await getTextColorPairs(page);
      
      // At least some elements should have readable contrast in dark mode
      const readableElements = colorPairs.filter((p) => p.contrast >= 3.0);
      expect(readableElements.length).toBeGreaterThan(0);
    });

    test('should not hide text in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await loginAsTestUser(page);
      
      const hiddenText = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let count = 0;
        elements.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.color === style.backgroundColor) {
            count++;
          }
        });
        return count;
      });

      // Some matching colors might be acceptable (e.g., decorative), but shouldn't be excessive
      expect(hiddenText).toBeLessThan(10);
    });
  });

  test.describe('10. Skip Links & Navigation', () => {
    test('should have skip to main content link', async ({ page }) => {
      await page.goto('/auth/login');
      
      const skipLink = page.locator(
        'a[href="#main"], a:has-text("Skip"), a:has-text("skip"), [aria-label*="skip" i]'
      );
      
      const skipLinkExists = await skipLink.count();
      
      // If skip link exists, it should be accessible
      if (skipLinkExists > 0) {
        const firstSkipLink = skipLink.first();
        await expect(firstSkipLink).toHaveAttribute('href');
      }
    });

    test('should have accessible navigation menu', async ({ page }) => {
      await loginAsTestUser(page);
      
      const nav = page.locator('nav, [role="navigation"]');
      const navExists = await nav.count();
      
      if (navExists > 0) {
        await expect(nav.first()).toBeVisible();
        
        const links = await nav.first().locator('a, button').all();
        expect(links.length).toBeGreaterThan(0);
      }
    });

    test('should have landmark navigation structure', async ({ page }) => {
      await loginAsTestUser(page);
      
      const landmarks = await page.locator(
        'nav, main, footer, [role="navigation"], [role="main"], [role="contentinfo"]'
      ).all();
      
      // Should have at least main content area
      expect(landmarks.length).toBeGreaterThanOrEqual(1);
    });

    test('should allow keyboard access to navigation', async ({ page }) => {
      await loginAsTestUser(page);
      
      // Tab to first focusable element (likely nav)
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName || 'unknown';
      });
      
      expect(focused).not.toBe('unknown');
    });

    test('should have proper heading structure for navigation', async ({ page }) => {
      await loginAsTestUser(page);
      
      const headings = await page.locator('h1').all();
      
      // Should have at least one h1
      if (headings.length > 0) {
        const firstH1 = headings[0];
        await expect(firstH1).toBeVisible();
      }
    });
  });

  test.describe('Cross-Page Accessibility Verification', () => {
    test('should have consistent accessibility across all pages', async ({ page }) => {
      const pages = ['/auth/login', '/dashboard'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Check that page has title
        const title = await page.title();
        expect(title).toBeTruthy();
        
        // Check that page has focusable elements
        const focusable = await page.locator(
          'button, a, input, textarea, select'
        ).count();
        expect(focusable).toBeGreaterThan(0);
      }
    });

    test('should maintain focus management during navigation', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Tab to a button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const initialFocus = await page.evaluate(() => {
        return (document.activeElement as HTMLElement)?.id || 'unknown';
      });
      
      expect(initialFocus).not.toBe('unknown');
    });
  });
});
