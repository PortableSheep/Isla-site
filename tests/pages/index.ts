import { Page } from '@playwright/test';
import { waitForElement, isElementVisible, getElementText } from '../helpers/page-utils';

/**
 * Page Object Model for Login Page
 */
export class LoginPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button:has-text("Sign In"), button[type="submit"]');
  }

  async getErrorMessage(): Promise<string> {
    await waitForElement(this.page, '[role="alert"]');
    return await getElementText(this.page, '[role="alert"]');
  }

  async isErrorVisible(): Promise<boolean> {
    return await isElementVisible(this.page, '[role="alert"]');
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForURL(/\/(dashboard|protected)/, { timeout: 10000 });
  }
}

/**
 * Page Object Model for Dashboard
 */
export class DashboardPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async isLoggedIn(): Promise<boolean> {
    return await isElementVisible(this.page, '[data-testid="user-menu"]');
  }

  async getUserMenu(): Promise<string> {
    return await getElementText(this.page, '[data-testid="user-menu"]');
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('button:has-text("Sign Out"), button:has-text("Logout")');
  }

  async getPostCount(): Promise<number> {
    return await this.page.locator('[data-testid="post-item"]').count();
  }

  async getPosts(): Promise<string[]> {
    const posts = await this.page.locator('[data-testid="post-content"]').allTextContents();
    return posts;
  }

  async clickPost(index: number): Promise<void> {
    await this.page.locator('[data-testid="post-item"]').nth(index).click();
  }

  async createPost(content: string): Promise<void> {
    await this.page.fill('[data-testid="post-composer-input"]', content);
    await this.page.click('[data-testid="post-composer-submit"]');
    await this.page.waitForSelector('[data-testid="post-item"]', { state: 'visible' });
  }

  async getNotificationCount(): Promise<number> {
    const badge = await this.page.$('[data-testid="notification-badge"]');
    if (!badge) return 0;
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }

  async openNotifications(): Promise<void> {
    await this.page.click('[data-testid="notification-bell"]');
  }

  async getNotificationsList(): Promise<string[]> {
    return await this.page.locator('[data-testid="notification-item"]').allTextContents();
  }
}

/**
 * Page Object Model for Family Page
 */
export class FamilyPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/family');
  }

  async getChildrenCount(): Promise<number> {
    return await this.page.locator('[data-testid="child-card"]').count();
  }

  async getChildNames(): Promise<string[]> {
    return await this.page.locator('[data-testid="child-name"]').allTextContents();
  }

  async addChild(name: string, age: string): Promise<void> {
    await this.page.click('[data-testid="add-child-button"]');
    await this.page.fill('[data-testid="child-name-input"]', name);
    await this.page.fill('[data-testid="child-age-input"]', age);
    await this.page.click('[data-testid="save-child-button"]');
    await this.page.waitForSelector('[data-testid="success-message"]');
  }

  async removeChild(index: number): Promise<void> {
    const removeButton = await this.page
      .locator('[data-testid="child-card"]')
      .nth(index)
      .locator('[data-testid="remove-child-button"]');
    await removeButton.click();
    await this.page.click('[data-testid="confirm-remove-button"]');
  }

  async getChildStatus(index: number): Promise<string> {
    return await getElementText(
      this.page,
      `[data-testid="child-card"]:nth-child(${index + 1}) [data-testid="child-status"]`,
    );
  }
}

/**
 * Page Object Model for Child Profile Page
 */
export class ChildProfilePage {
  constructor(private page: Page) {}

  async goto(childId: string): Promise<void> {
    await this.page.goto(`/dashboard/child/${childId}`);
  }

  async getChildName(): Promise<string> {
    return await getElementText(this.page, '[data-testid="child-profile-name"]');
  }

  async getChildAge(): Promise<string> {
    return await getElementText(this.page, '[data-testid="child-profile-age"]');
  }

  async getPostsCount(): Promise<number> {
    return await this.page.locator('[data-testid="child-post-item"]').count();
  }

  async editProfile(updates: { name?: string; age?: string; bio?: string }): Promise<void> {
    await this.page.click('[data-testid="edit-profile-button"]');

    if (updates.name) {
      await this.page.fill('[data-testid="child-name-input"]', updates.name);
    }
    if (updates.age) {
      await this.page.fill('[data-testid="child-age-input"]', updates.age);
    }
    if (updates.bio) {
      await this.page.fill('[data-testid="child-bio-input"]', updates.bio);
    }

    await this.page.click('[data-testid="save-profile-button"]');
  }
}

/**
 * Page Object Model for Notifications Settings
 */
export class NotificationSettingsPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/settings/notifications');
  }

  async enableEmailUpdates(): Promise<void> {
    const checkbox = await this.page.$('[data-testid="email-updates-checkbox"]');
    if (checkbox && !(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  async disableEmailUpdates(): Promise<void> {
    const checkbox = await this.page.$('[data-testid="email-updates-checkbox"]');
    if (checkbox && (await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  async setEmailFrequency(frequency: string): Promise<void> {
    await this.page.click('[data-testid="email-frequency-select"]');
    await this.page.click(`button:has-text("${frequency}")`);
  }

  async setDigestDay(day: string): Promise<void> {
    await this.page.click('[data-testid="digest-day-select"]');
    await this.page.click(`button:has-text("${day}")`);
  }

  async saveSettings(): Promise<void> {
    await this.page.click('[data-testid="save-settings-button"]');
    await this.page.waitForSelector('[data-testid="settings-saved-message"]');
  }
}

/**
 * Page Object Model for Posts/Feed Page
 */
export class FeedPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/feed');
  }

  async getPostsCount(): Promise<number> {
    return await this.page.locator('[data-testid="post-item"]').count();
  }

  async createPost(content: string, familyId?: string): Promise<void> {
    await this.page.fill('[data-testid="post-composer-input"]', content);

    if (familyId) {
      await this.page.click('[data-testid="family-selector"]');
      await this.page.click(`[data-testid="family-option-${familyId}"]`);
    }

    await this.page.click('[data-testid="post-composer-submit"]');
    await this.page.waitForSelector('[data-testid="post-item"]', { state: 'visible' });
  }

  async replyToPost(index: number, content: string): Promise<void> {
    const post = this.page.locator('[data-testid="post-item"]').nth(index);
    await post.locator('[data-testid="reply-button"]').click();
    await this.page.fill('[data-testid="reply-composer-input"]', content);
    await this.page.click('[data-testid="reply-composer-submit"]');
  }

  async likePost(index: number): Promise<void> {
    const post = this.page.locator('[data-testid="post-item"]').nth(index);
    await post.locator('[data-testid="like-button"]').click();
  }

  async flagPost(index: number, reason: string): Promise<void> {
    const post = this.page.locator('[data-testid="post-item"]').nth(index);
    await post.locator('[data-testid="more-options-button"]').click();
    await this.page.click('[data-testid="flag-post-option"]');
    await this.page.fill('[data-testid="flag-reason-input"]', reason);
    await this.page.click('[data-testid="submit-flag-button"]');
  }

  async deletePost(index: number): Promise<void> {
    const post = this.page.locator('[data-testid="post-item"]').nth(index);
    await post.locator('[data-testid="more-options-button"]').click();
    await this.page.click('[data-testid="delete-post-option"]');
    await this.page.click('[data-testid="confirm-delete-button"]');
  }
}


// Export moderation and audit log pages
export { ModerationPage } from './moderation.page';
export { AuditLogPage } from './audit-log.page';
export { SettingsPage } from './settings.page';
