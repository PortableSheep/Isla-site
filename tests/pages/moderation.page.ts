import { Page, expect } from '@playwright/test';

/**
 * Page Object for Moderation Dashboard
 * Handles all moderation-related interactions including:
 * - Viewing flagged posts
 * - Hiding posts with reasons
 * - Deleting posts with reasons
 * - Managing flag statuses
 * - Viewing moderation statistics
 */
export class ModerationPage {
  constructor(private page: Page) {}

  async navigateToModerationQueue() {
    await this.page.goto('/admin/moderation');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToModerationQueueForFamily(familyId: string) {
    await this.page.goto(`/admin/moderation?family=${familyId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getFlaggedPostCount(): Promise<number> {
    return await this.page.locator('[data-testid="flagged-post"], [data-testid="post-item"]').count();
  }

  async getTotalFlagCount(): Promise<number> {
    const badge = this.page.locator('[data-testid="total-flags"], .flag-badge, [data-testid="flag-count"]').first();
    const count = await badge.textContent();
    return parseInt(count?.replace(/\D/g, '') || '0', 10);
  }

  async getPendingFlagCount(): Promise<number> {
    const badge = this.page.locator('[data-testid="pending-flags"], .pending-badge').first();
    const count = await badge.textContent();
    return parseInt(count?.replace(/\D/g, '') || '0', 10);
  }

  async getReviewedFlagCount(): Promise<number> {
    const badge = this.page.locator('[data-testid="reviewed-flags"], .reviewed-badge').first();
    const count = await badge.textContent();
    return parseInt(count?.replace(/\D/g, '') || '0', 10);
  }

  async getFlagReasonForPost(postIndex: number): Promise<string> {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    const reason = await postItem.locator('[data-testid="flag-reason"], .reason-badge, .badge').first().textContent();
    return reason || '';
  }

  async getFlagCommentForPost(postIndex: number): Promise<string> {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    const comment = await postItem.locator('[data-testid="flag-comment"], .comment-text').textContent();
    return comment || '';
  }

  async getFlagCountForPost(postIndex: number): Promise<number> {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    const badge = await postItem.locator('[data-testid="flag-count"], .flag-count-badge').first().textContent();
    return parseInt(badge?.replace(/\D/g, '') || '1', 10);
  }

  async hidePost(postIndex: number, reason: string, internalNote?: string) {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    
    // Click hide button
    const hideButton = postItem.locator('[data-testid="hide-post-btn"], button:has-text("Hide")').first();
    await hideButton.click();

    // Wait for modal
    await this.page.waitForSelector('[data-testid="hide-modal"], dialog, [role="dialog"]', { timeout: 5000 });

    // Select reason
    const reasonSelect = this.page.locator('[data-testid="hide-reason-select"], select[name="reason"], [data-testid="reason-select"]').first();
    if (await reasonSelect.isVisible()) {
      await reasonSelect.selectOption(reason);
    }

    // Add internal note if provided
    if (internalNote) {
      const noteField = this.page.locator('[data-testid="hide-note"], textarea[name="note"], [data-testid="internal-note"]').first();
      if (await noteField.isVisible()) {
        await noteField.fill(internalNote);
      }
    }

    // Submit
    const submitButton = this.page.locator('[data-testid="hide-confirm"], button:has-text("Hide"), button[type="submit"]').first();
    await submitButton.click();

    // Wait for success message or page update
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async deletePost(postIndex: number, reason: string, internalNote?: string) {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);

    // Click delete button
    const deleteButton = postItem.locator('[data-testid="delete-post-btn"], button:has-text("Delete")').first();
    await deleteButton.click();

    // Wait for modal
    await this.page.waitForSelector('[data-testid="delete-modal"], dialog, [role="dialog"]', { timeout: 5000 });

    // Select reason
    const reasonSelect = this.page.locator('[data-testid="delete-reason-select"], select[name="reason"], [data-testid="reason-select"]').first();
    if (await reasonSelect.isVisible()) {
      await reasonSelect.selectOption(reason);
    }

    // Add internal note if provided
    if (internalNote) {
      const noteField = this.page.locator('[data-testid="delete-note"], textarea[name="note"], [data-testid="internal-note"]').first();
      if (await noteField.isVisible()) {
        await noteField.fill(internalNote);
      }
    }

    // Submit
    const submitButton = this.page.locator('[data-testid="delete-confirm"], button:has-text("Delete"), button[type="submit"]').first();
    await submitButton.click();

    // Wait for success message or page update
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async dismissFlag(postIndex: number) {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);

    // Click dismiss button
    const dismissButton = postItem.locator('[data-testid="dismiss-flag-btn"], button:has-text("Dismiss")').first();
    await dismissButton.click();

    // Wait for page update
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async updateFlagStatus(postIndex: number, newStatus: 'pending' | 'reviewed' | 'dismissed') {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);

    // Click status dropdown
    const statusButton = postItem.locator('[data-testid="flag-status"], [data-testid="status-dropdown"]').first();
    await statusButton.click();

    // Select new status
    await this.page.click(`[data-testid="status-${newStatus}"], button:has-text("${newStatus}")`);

    // Wait for update
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async searchFlaggedPosts(query: string) {
    const searchInput = this.page.locator('[data-testid="flag-search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.clear();
      await searchInput.fill(query);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async filterByReason(reason: string) {
    const reasonFilter = this.page.locator('[data-testid="filter-reason"], select[name="reason"]').first();
    if (await reasonFilter.isVisible()) {
      await reasonFilter.selectOption(reason);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async filterByStatus(status: 'all' | 'pending' | 'reviewed' | 'dismissed') {
    const statusFilter = this.page.locator('[data-testid="filter-status"], select[name="status"]').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption(status);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async sortBy(field: 'date' | 'flags' | 'reason') {
    const sortButton = this.page.locator(`[data-testid="sort-${field}"], button:has-text("${field}")`).first();
    if (await sortButton.isVisible()) {
      await sortButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async getPostContent(postIndex: number): Promise<string> {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    const content = await postItem.locator('[data-testid="post-content"], .post-text, [data-testid="content"]').textContent();
    return content || '';
  }

  async getPostAuthor(postIndex: number): Promise<string> {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    const author = await postItem.locator('[data-testid="post-author"], .author-name').textContent();
    return author || '';
  }

  async getPostCreatedDate(postIndex: number): Promise<string> {
    const postItem = this.page.locator('[data-testid="flagged-post"]').nth(postIndex);
    const date = await postItem.locator('[data-testid="post-date"], .date, time').textContent();
    return date || '';
  }

  async verifyHidePostSuccess(): Promise<boolean> {
    const successMsg = this.page.locator('[data-testid="hide-success"], .alert-success, .toast-success').first();
    return await successMsg.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async verifyDeletePostSuccess(): Promise<boolean> {
    const successMsg = this.page.locator('[data-testid="delete-success"], .alert-success, .toast-success').first();
    return await successMsg.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async verifyPostHidden(postContent: string): Promise<boolean> {
    // Post should either not exist or show "Content hidden" message
    const postStillVisible = await this.page.locator(`text=${postContent}`).isVisible().catch(() => false);
    const hiddenMessage = await this.page.locator('text=Content hidden, [data-testid="content-hidden"]').isVisible().catch(() => false);
    return !postStillVisible || hiddenMessage;
  }

  async getStatistics(): Promise<{
    totalFlags: number;
    pendingFlags: number;
    reviewedFlags: number;
    dismissedFlags: number;
  }> {
    const totalFlags = await this.page.locator('[data-testid="stat-total-flags"], [data-testid="total-flags"]').first().textContent();
    const pendingFlags = await this.page.locator('[data-testid="stat-pending-flags"], [data-testid="pending-flags"]').first().textContent();
    const reviewedFlags = await this.page.locator('[data-testid="stat-reviewed-flags"], [data-testid="reviewed-flags"]').first().textContent();
    const dismissedFlags = await this.page.locator('[data-testid="stat-dismissed-flags"], [data-testid="dismissed-flags"]').first().textContent();

    return {
      totalFlags: parseInt(totalFlags?.replace(/\D/g, '') || '0', 10),
      pendingFlags: parseInt(pendingFlags?.replace(/\D/g, '') || '0', 10),
      reviewedFlags: parseInt(reviewedFlags?.replace(/\D/g, '') || '0', 10),
      dismissedFlags: parseInt(dismissedFlags?.replace(/\D/g, '') || '0', 10),
    };
  }

  async exportModerationReport(format: 'csv' | 'json' = 'csv') {
    const exportButton = this.page.locator('[data-testid="export-btn"], button:has-text("Export")').first();
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // If modal appears, select format
      const formatSelect = this.page.locator('[data-testid="export-format"], select[name="format"]').first();
      if (await formatSelect.isVisible()) {
        await formatSelect.selectOption(format);
      }

      // Click download/export
      const downloadButton = this.page.locator('[data-testid="download-btn"], button:has-text("Download")').first();
      await downloadButton.click();

      // Wait for download
      await this.page.waitForLoadState('networkidle');
    }
  }

  async verifyCannotAccess(): Promise<boolean> {
    try {
      const response = await this.page.goto('/admin/moderation', { waitUntil: 'networkidle' });
      const statusCode = response?.status();
      return [301, 302, 401, 403].includes(statusCode || 200);
    } catch {
      return true; // Couldn't access
    }
  }
}
