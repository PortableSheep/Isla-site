import { Page, expect } from '@playwright/test';

/**
 * Page Object for Audit Logs Dashboard
 * Handles all audit log interactions including:
 * - Viewing audit log entries
 * - Filtering by action type
 * - Filtering by date range
 * - Searching logs
 * - Exporting audit reports
 */
export class AuditLogPage {
  constructor(private page: Page) {}

  async navigateToAuditLogs() {
    await this.page.goto('/admin/audit-logs');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToUserAuditLogs(userId: string) {
    await this.page.goto(`/admin/audit-logs?user=${userId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToPostAuditLogs(postId: string) {
    await this.page.goto(`/admin/audit-logs?post=${postId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getAuditLogCount(): Promise<number> {
    return await this.page.locator('[data-testid="audit-log-row"], tbody tr, [role="row"]').count();
  }

  async getAuditLogEntry(index: number): Promise<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }> {
    const row = this.page.locator('[data-testid="audit-log-row"], tbody tr, [role="row"]').nth(index);

    const timestamp = await row.locator('[data-testid="log-timestamp"], td:nth-child(1), [data-col="timestamp"]').textContent();
    const action = await row.locator('[data-testid="log-action"], td:nth-child(2), [data-col="action"]').textContent();
    const user = await row.locator('[data-testid="log-user"], td:nth-child(3), [data-col="user"]').textContent();
    const details = await row.locator('[data-testid="log-details"], td:nth-child(4), [data-col="details"]').textContent();

    return {
      timestamp: timestamp?.trim() || '',
      action: action?.trim() || '',
      user: user?.trim() || '',
      details: details?.trim() || '',
    };
  }

  async getAuditLogEntries(limit: number = 10): Promise<Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>> {
    const entries = [];
    const rowCount = Math.min(await this.getAuditLogCount(), limit);

    for (let i = 0; i < rowCount; i++) {
      entries.push(await this.getAuditLogEntry(i));
    }

    return entries;
  }

  async filterByAction(action: string) {
    const actionFilter = this.page.locator('[data-testid="filter-action"], select[name="action"], [data-testid="action-filter"]').first();
    if (await actionFilter.isVisible()) {
      await actionFilter.selectOption(action);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async filterByActionType(actionType: 'hide' | 'delete' | 'suspend' | 'unsuspend' | 'appeal' | 'flag') {
    await this.filterByAction(actionType);
  }

  async filterByDateRange(startDate: string, endDate: string) {
    const dateFromField = this.page.locator('[data-testid="filter-date-from"], input[type="date"], [data-testid="start-date"]').first();
    const dateToField = this.page.locator('[data-testid="filter-date-to"], input[type="date"], [data-testid="end-date"]').first();

    if (await dateFromField.isVisible()) {
      await dateFromField.fill(startDate);
    }

    if (await dateToField.isVisible()) {
      await dateToField.fill(endDate);
    }

    // Apply filter
    const applyButton = this.page.locator('[data-testid="apply-filter"], button:has-text("Apply"), button:has-text("Filter")').first();
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  async filterByUser(userId: string) {
    const userFilter = this.page.locator('[data-testid="filter-user"], input[name="user"], [data-testid="user-search"]').first();
    if (await userFilter.isVisible()) {
      await userFilter.fill(userId);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async filterByUserEmail(email: string) {
    await this.filterByUser(email);
  }

  async filterByResourceType(resourceType: 'post' | 'user' | 'family' | 'flag') {
    const resourceFilter = this.page.locator('[data-testid="filter-resource"], select[name="resource"], [data-testid="resource-filter"]').first();
    if (await resourceFilter.isVisible()) {
      await resourceFilter.selectOption(resourceType);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async searchLogs(query: string) {
    const searchInput = this.page.locator('[data-testid="log-search"], input[placeholder*="Search"], [data-testid="search-logs"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.clear();
      await searchInput.fill(query);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async sortByColumn(column: 'timestamp' | 'action' | 'user' | 'details') {
    const columnHeader = this.page.locator(`[data-testid="sort-${column}"], th:has-text("${column}"), [data-col="${column}"]`).first();
    if (await columnHeader.isVisible()) {
      await columnHeader.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async sortByTimestamp() {
    await this.sortByColumn('timestamp');
  }

  async sortByAction() {
    await this.sortByColumn('action');
  }

  async sortByUser() {
    await this.sortByColumn('user');
  }

  async clearFilters() {
    const clearButton = this.page.locator('[data-testid="clear-filters"], button:has-text("Clear"), button:has-text("Reset")').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async exportLogs(format: 'csv' | 'json' | 'pdf' = 'csv') {
    const exportButton = this.page.locator('[data-testid="export-logs"], button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // If format selector appears
      const formatSelect = this.page.locator('[data-testid="export-format"], select[name="format"]').first();
      if (await formatSelect.isVisible()) {
        await formatSelect.selectOption(format);
      }

      // Confirm export
      const confirmButton = this.page.locator('[data-testid="confirm-export"], button:has-text("Download"), button:has-text("Export")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await this.page.waitForLoadState('networkidle');
    }
  }

  async verifyLogEntry(expectedAction: string): Promise<boolean> {
    const actionCell = this.page.locator(`[data-testid="log-action"], td:has-text("${expectedAction}")`).first();
    return await actionCell.isVisible().catch(() => false);
  }

  async verifyLogEntryWithUser(expectedAction: string, expectedUser: string): Promise<boolean> {
    const rows = this.page.locator('[data-testid="audit-log-row"], tbody tr');
    
    for (let i = 0; i < await rows.count(); i++) {
      const row = rows.nth(i);
      const action = await row.locator('[data-testid="log-action"]').textContent();
      const user = await row.locator('[data-testid="log-user"]').textContent();

      if (action?.includes(expectedAction) && user?.includes(expectedUser)) {
        return true;
      }
    }

    return false;
  }

  async getLatestLogEntry(): Promise<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  } | null> {
    const logCount = await this.getAuditLogCount();
    if (logCount === 0) return null;

    return await this.getAuditLogEntry(0);
  }

  async verifyActionLogged(action: string, resourceId?: string): Promise<boolean> {
    // Navigate to logs if not already there
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/audit-logs')) {
      await this.navigateToAuditLogs();
    }

    // Search for action
    await this.searchLogs(action);

    // Check if any results found
    const logCount = await this.getAuditLogCount();
    
    if (logCount === 0) {
      return false; // No logs found
    }

    // If resourceId provided, verify it's in the details
    if (resourceId) {
      for (let i = 0; i < logCount; i++) {
        const entry = await this.getAuditLogEntry(i);
        if (entry.details.includes(resourceId)) {
          return true;
        }
      }
      return false;
    }

    return true; // Action found in logs
  }

  async getActionCount(action: string): Promise<number> {
    await this.filterByAction(action);
    return await this.getAuditLogCount();
  }

  async verifyPaginationControls(): Promise<boolean> {
    const prevButton = this.page.locator('[data-testid="prev-page"], button[aria-label="Previous"]').first();
    const nextButton = this.page.locator('[data-testid="next-page"], button[aria-label="Next"]').first();
    const pageInfo = this.page.locator('[data-testid="page-info"], .page-info').first();

    const prevVisible = await prevButton.isVisible().catch(() => false);
    const nextVisible = await nextButton.isVisible().catch(() => false);
    const pageInfoVisible = await pageInfo.isVisible().catch(() => false);

    return prevVisible || nextVisible || pageInfoVisible;
  }

  async goToNextPage() {
    const nextButton = this.page.locator('[data-testid="next-page"], button:has-text("Next"), [aria-label="Next page"]').first();
    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      await nextButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async goToPreviousPage() {
    const prevButton = this.page.locator('[data-testid="prev-page"], button:has-text("Previous"), [aria-label="Previous page"]').first();
    if (await prevButton.isVisible() && !(await prevButton.isDisabled())) {
      await prevButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async goToPage(pageNumber: number) {
    const pageInput = this.page.locator('[data-testid="page-input"], input[type="number"]').first();
    if (await pageInput.isVisible()) {
      await pageInput.fill(pageNumber.toString());
      await this.page.press('[data-testid="page-input"], input', 'Enter');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async verifyCannotAccess(): Promise<boolean> {
    try {
      const response = await this.page.goto('/admin/audit-logs', { waitUntil: 'networkidle' });
      const statusCode = response?.status();
      return [301, 302, 401, 403].includes(statusCode || 200);
    } catch {
      return true; // Couldn't access
    }
  }

  async verifyTableColumns(): Promise<string[]> {
    const headers = await this.page.locator('thead th, [role="columnheader"]').allTextContents();
    return headers.map(h => h.trim()).filter(h => h.length > 0);
  }

  async verifyColumnExists(columnName: string): Promise<boolean> {
    const columns = await this.verifyTableColumns();
    return columns.some(col => col.toLowerCase().includes(columnName.toLowerCase()));
  }

  async getLogsByAction(action: string): Promise<Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>> {
    await this.filterByAction(action);
    return await this.getAuditLogEntries();
  }

  async getLogsByDateRange(startDate: string, endDate: string): Promise<Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>> {
    await this.filterByDateRange(startDate, endDate);
    return await this.getAuditLogEntries();
  }

  async verifyLogTimestampFormat(): Promise<boolean> {
    const entries = await this.getAuditLogEntries(1);
    if (entries.length === 0) return false;

    const timestamp = entries[0].timestamp;
    // Check if timestamp looks like a date (ISO, US, or European format)
    const dateRegex = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
    return dateRegex.test(timestamp);
  }
}
