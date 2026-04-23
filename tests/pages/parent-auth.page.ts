import { Page, expect } from '@playwright/test';

/**
 * Page Object for Parent Authentication
 * Handles parent and child login/logout flows
 */
export class ParentAuthPage {
  constructor(private page: Page) {}

  async loginAsParent(email: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/dashboard', { timeout: 5000 });
  }

  async loginAsChild(email: string, password: string) {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForNavigation();
  }

  async logout() {
    await this.page.click('button[aria-label="User menu"]');
    await this.page.click('button:has-text("Logout")');
    await this.page.waitForURL('**/auth/login', { timeout: 5000 });
  }

  async isLoggedIn(): Promise<boolean> {
    const response = await this.page.evaluate(() => {
      return fetch('/api/auth/me').then(r => r.ok);
    });
    return response;
  }
}
