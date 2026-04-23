import { Page, expect } from '@playwright/test';

/**
 * Page Object for Thread/Conversation View
 * Handles viewing and replying to posts with threaded comments
 */
export class ThreadPage {
  constructor(private page: Page) {}

  async clickPostToOpenThread(postContent: string) {
    const post = this.page.locator(`text="${postContent}"`).locator('..').locator('..').first();
    await post.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickReplyButton(postIndex: number = 0) {
    const posts = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post');
    const post = posts.nth(postIndex);
    const replyBtn = post.locator('button:has-text("Reply"), button[aria-label*="Reply"]').first();
    await replyBtn.click();
  }

  async waitForReplyComposer() {
    const composer = this.page.locator('[data-testid="reply-composer"], textarea, [role="dialog"]').first();
    await composer.waitFor({ state: 'visible', timeout: 5000 });
  }

  async typeReplyMessage(message: string) {
    const textarea = this.page.locator('textarea[placeholder*="reply"], textarea[placeholder*="Reply"]').first();
    await textarea.click();
    await textarea.fill(message);
  }

  async submitReply() {
    const submitBtn = this.page.locator('button:has-text("Post"), button:has-text("Send"), button[type="submit"]').first();
    await submitBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async createReply(message: string, postIndex: number = 0) {
    await this.clickReplyButton(postIndex);
    await this.waitForReplyComposer();
    await this.typeReplyMessage(message);
    await this.submitReply();
  }

  async getReplyCount(postIndex: number = 0): Promise<number> {
    const post = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post').nth(postIndex);
    const replyCount = post.locator('[data-testid="reply-count"], .reply-count, text=/\d+\s*replies?/');
    const text = await replyCount.first().textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async verifyReplyInThread(replyContent: string) {
    const reply = this.page.locator(`text="${replyContent}"`);
    await expect(reply).toBeVisible();
  }

  async verifyThreadViewOpen() {
    const thread = this.page.locator('[data-testid="thread"], [data-testid="thread-view"], .thread').first();
    await expect(thread).toBeVisible();
  }

  async getAllReplies(): Promise<string[]> {
    const replies = await this.page.locator('[data-testid="reply"], .reply, .comment').all();
    const replyTexts: string[] = [];

    for (const reply of replies) {
      const text = await reply.textContent();
      if (text) replyTexts.push(text.trim());
    }

    return replyTexts;
  }

  async verifyReplyOrder(): Promise<boolean> {
    // Get timestamps of replies to verify chronological order
    const timestamps = this.page.locator('[data-testid="reply-time"], time, .timestamp');
    const count = await timestamps.count();

    if (count < 2) return true; // Only one or zero replies

    const times: number[] = [];
    for (let i = 0; i < count; i++) {
      const dateStr = await timestamps.nth(i).getAttribute('datetime') || await timestamps.nth(i).textContent() || '';
      const time = new Date(dateStr).getTime();
      times.push(time);
    }

    // Verify chronological order (ascending)
    for (let i = 1; i < times.length; i++) {
      if (times[i] < times[i - 1]) return false;
    }

    return true;
  }

  async verifyReplyAuthorAndTimestamp(replyContent: string) {
    const reply = this.page.locator(`text="${replyContent}"`).locator('..').first();
    const author = reply.locator('[data-testid="reply-author"], .author, strong').first();
    const timestamp = reply.locator('[data-testid="reply-time"], time, .timestamp').first();

    await expect(author).toBeVisible();
    await expect(timestamp).toBeVisible();
  }

  async verifyNestedIndentation(): Promise<boolean> {
    // Check if nested replies have increased indentation
    const parentReply = this.page.locator('[data-testid="reply"][data-depth="0"]').first();
    const childReply = this.page.locator('[data-testid="reply"][data-depth="1"]').first();

    if (!parentReply || !childReply) return false;

    const parentBox = await parentReply.boundingBox();
    const childBox = await childReply.boundingBox();

    if (!parentBox || !childBox) return false;

    // Child should be indented (have greater left position)
    return childBox.x > parentBox.x;
  }

  async replyToReply(parentReplyIndex: number, replyMessage: string) {
    const replies = this.page.locator('[data-testid="reply"], .reply');
    const parentReply = replies.nth(parentReplyIndex);
    const replyBtn = parentReply.locator('button:has-text("Reply")').first();
    await replyBtn.click();
    await this.waitForReplyComposer();
    await this.typeReplyMessage(replyMessage);
    await this.submitReply();
  }

  async verifyReplyCharacterLimit() {
    const textarea = this.page.locator('textarea[placeholder*="reply"]').first();
    const maxLength = await textarea.getAttribute('maxlength');
    return maxLength ? parseInt(maxLength, 10) : 500;
  }

  async closeThread() {
    const closeBtn = this.page.locator('button[aria-label="Close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.goBack();
    }
    await this.page.waitForLoadState('networkidle');
  }

  async getThreadTitle(): Promise<string> {
    const title = this.page.locator('[data-testid="thread-title"], h1, h2').first();
    return await title.textContent() || '';
  }

  async verifyThreadCollapsed() {
    const expandBtn = this.page.locator('button:has-text("Show"), button[aria-expanded="false"]').first();
    await expect(expandBtn).toBeVisible();
  }

  async expandCollapsedThread() {
    const expandBtn = this.page.locator('button:has-text("Show"), button[aria-expanded="false"]').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async getVisibleReplyCount(): Promise<number> {
    const replies = this.page.locator('[data-testid="reply"], .reply, .comment');
    return await replies.count();
  }
}
