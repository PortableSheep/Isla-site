import { Page, expect } from '@playwright/test';

/**
 * Page Object for Post Composer and Creation
 * Handles creating posts, replies, and managing post content
 */
export class PostComposerPage {
  constructor(private page: Page) {}

  async clickCreatePost() {
    const createBtn = this.page.locator('button:has-text("Create Post"), button:has-text("New Post"), button:has-text("Post")').first();
    await createBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForComposerToOpen() {
    // Wait for modal or inline composer
    const composer = this.page.locator('[data-testid="post-composer"], [data-testid="composer"], textarea, [role="dialog"]').first();
    await composer.waitFor({ state: 'visible', timeout: 5000 });
  }

  async typePostMessage(message: string) {
    const textarea = this.page.locator('textarea[placeholder*="message"], textarea[placeholder*="post"], textarea[placeholder*="What"]').first();
    await textarea.click();
    await textarea.fill(message);
  }

  async submitPost() {
    const submitBtn = this.page.locator('button[type="submit"]:has-text("Post"), button[type="submit"]:has-text("Send"), button:has-text("Publish")').first();
    await submitBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async createPost(content: string) {
    await this.clickCreatePost();
    await this.waitForComposerToOpen();
    await this.typePostMessage(content);
    await this.submitPost();
  }

  async createMultiplePosts(messages: string[]) {
    for (const message of messages) {
      await this.createPost(message);
      // Wait between posts to ensure proper ordering
      await this.page.waitForTimeout(500);
    }
  }

  async verifyPostAppearsAtTop(content: string) {
    const firstPost = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post').first();
    const postContent = await firstPost.textContent();
    expect(postContent).toContain(content);
  }

  async getCharacterCount(): Promise<number> {
    const textarea = this.page.locator('textarea[placeholder*="message"], textarea[placeholder*="post"]').first();
    const value = await textarea.inputValue();
    return value?.length || 0;
  }

  async getCharacterLimit(): Promise<number> {
    const counter = this.page.locator('[data-testid="char-count"], .char-count').first();
    const text = await counter.textContent();
    // Extract number from text like "150 / 500"
    const match = text?.match(/\/\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 500;
  }

  async typeCharacters(count: number) {
    const char = 'a';
    const message = char.repeat(count);
    const textarea = this.page.locator('textarea[placeholder*="message"], textarea[placeholder*="post"]').first();
    await textarea.click();
    await textarea.fill(message);
  }

  async getComposerValue(): Promise<string> {
    const textarea = this.page.locator('textarea[placeholder*="message"], textarea[placeholder*="post"]').first();
    return await textarea.inputValue() || '';
  }

  async clearComposer() {
    const textarea = this.page.locator('textarea[placeholder*="message"], textarea[placeholder*="post"]').first();
    await textarea.click();
    await textarea.clear();
  }

  async attemptSubmitEmpty() {
    const submitBtn = this.page.locator('button[type="submit"]:has-text("Post"), button[type="submit"]:has-text("Send")').first();
    const isDisabled = await submitBtn.isDisabled();
    return isDisabled;
  }

  async verifyErrorMessage(errorText: string) {
    const error = this.page.locator(`text="${errorText}"`);
    await expect(error).toBeVisible();
  }

  async verifyCharacterLimitError() {
    const error = this.page.locator('text=exceeds, text=too long, text=limit').first();
    await expect(error).toBeVisible();
  }

  async verifySuccessMessage() {
    const success = this.page.locator('text=Posted, text=Success, text=Created').first();
    await expect(success).toBeVisible({ timeout: 3000 });
  }

  async closeComposer() {
    const closeBtn = this.page.locator('button[aria-label="Close"], button[aria-label="Cancel"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.press('Escape');
    }
  }

  async verifyAuthorNameDisplayed(authorName: string) {
    const author = this.page.locator(`text="${authorName}"`).first();
    await expect(author).toBeVisible();
  }

  async verifyTimestampDisplayed() {
    const timestamp = this.page.locator('[data-testid="post-time"], time, .timestamp').first();
    await expect(timestamp).toBeVisible();
  }

  async verifyUpdateBadge() {
    const badge = this.page.locator('[data-testid="update-badge"], .update-badge, text=UPDATE').first();
    await expect(badge).toBeVisible();
  }

  async createUpdatePost(content: string) {
    // This assumes update flag can be set in UI
    await this.clickCreatePost();
    await this.waitForComposerToOpen();
    
    // Check for update toggle/checkbox
    const updateToggle = this.page.locator('input[type="checkbox"][aria-label*="Update"], label:has-text("Update")').first();
    if (await updateToggle.isVisible()) {
      await updateToggle.click();
    }
    
    await this.typePostMessage(content);
    await this.submitPost();
  }
}
