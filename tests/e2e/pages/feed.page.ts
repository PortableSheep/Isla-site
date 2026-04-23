import { Page, expect } from '@playwright/test';

/**
 * Page Object for Wall Feed Interactions
 * Handles all feed-related operations including viewing posts, pagination, and filters
 */
export class FeedPage {
  constructor(private page: Page) {}

  async navigateToWall() {
    await this.page.goto('/wall');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToUpdates() {
    await this.page.goto('/updates');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForFeedToLoad() {
    // Wait for feed container to be visible
    await this.page.locator('[data-testid="feed"], main, .feed').first().waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  async getPostCount(): Promise<number> {
    const allPosts = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post');
    const count = await allPosts.count();
    return count;
  }

  async getPostContentAt(index: number): Promise<string> {
    const post = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post').nth(index);
    return await post.textContent() || '';
  }

  async getFirstPostContent(): Promise<string> {
    const post = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post').first();
    return await post.textContent() || '';
  }

  async verifyPaginationControls() {
    const pagination = this.page.locator('[data-testid="pagination"], .pagination, nav[aria-label*="Pagination"]').first();
    await expect(pagination).toBeVisible();
  }

  async clickLoadMore() {
    const loadMoreBtn = this.page.locator('button:has-text("Load More"), button:has-text("Show More")').first();
    await loadMoreBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async refreshFeed() {
    const refreshBtn = this.page.locator('button[title*="Refresh"], button[aria-label*="Refresh"]').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
    } else {
      // Fallback: reload page
      await this.page.reload();
    }
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPostsLoadedInLessThanSecond(): Promise<boolean> {
    const startTime = Date.now();
    await this.waitForFeedToLoad();
    const elapsed = Date.now() - startTime;
    return elapsed < 1000;
  }

  async clickNextPage() {
    const nextBtn = this.page.locator('button[aria-label*="Next"], a[aria-label*="Next"]').first();
    await nextBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isPaginationVisible(): Promise<boolean> {
    const pagination = this.page.locator('[data-testid="pagination"], .pagination, nav[aria-label*="Pagination"]').first();
    return await pagination.isVisible();
  }

  async getVisiblePostCount(): Promise<number> {
    const posts = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post');
    return await posts.count();
  }

  async verifyEmptyFeedMessage() {
    const emptyMsg = this.page.locator('text=No posts yet, text=Empty, text=No messages').first();
    await expect(emptyMsg).toBeVisible();
  }

  async verifyPostByContent(content: string) {
    const post = this.page.locator(`text="${content}"`).locator('..').locator('..').first();
    await expect(post).toBeVisible();
  }

  async scrollToBottom() {
    await this.page.locator('body').evaluate((body) => {
      body.scrollTop = body.scrollHeight;
    });
  }

  async scrollToTop() {
    await this.page.locator('body').evaluate((body) => {
      body.scrollTop = 0;
    });
  }

  async isKeyboardNavigable(): Promise<boolean> {
    // Check if feed items are focusable
    const posts = this.page.locator('[data-testid="post"], [data-testid="feed-item"], article, .post');
    const count = await posts.count();
    if (count === 0) return false;

    // Try to focus first post
    const firstPost = posts.first();
    const focusable = await firstPost.evaluate((el) => {
      const focusableElement = el.querySelector('button, a, [tabindex]');
      return focusableElement !== null;
    });

    return focusable;
  }

  async getFilterOptions(): Promise<string[]> {
    const filters = this.page.locator('[data-testid="filter"], .filter, [role="tab"]');
    const count = await filters.count();
    const options: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await filters.nth(i).textContent();
      if (text) options.push(text.trim());
    }

    return options;
  }
}
