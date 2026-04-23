import { Page, expect } from '@playwright/test';

/**
 * Page Object for Family Management
 * Handles all family-related interactions including:
 * - Family creation and management
 * - Invite token generation and acceptance
 * - Child approval/rejection workflow
 * - Multi-family switching
 * - Permission verification
 */
export class FamilyManagementPage {
  constructor(private page: Page) {}

  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToFamilySettings() {
    await this.page.goto('/settings');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToApprovals() {
    await this.page.goto('/approvals');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToWall() {
    await this.page.goto('/wall');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToChildren() {
    await this.page.goto('/children');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAdminModerationQueue() {
    await this.page.goto('/admin/moderation');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToAuditLogs() {
    await this.page.goto('/admin/audit-logs');
    await this.page.waitForLoadState('networkidle');
  }

  async createFamily(familyName: string) {
    await this.navigateToDashboard();
    
    const createBtn = this.page.locator('button:has-text("Create Family")');
    await createBtn.click();
    
    await this.page.waitForSelector('dialog, [role="dialog"]', { timeout: 5000 });
    
    await this.page.fill('input[placeholder*="Family name"], input[placeholder*="name"], input[name*="family"]', familyName);
    
    await this.page.click('button[type="submit"]:has-text("Create"), button:has-text("Submit")');
    
    await this.page.waitForLoadState('networkidle');
    
    return familyName;
  }

  async generateInviteToken(): Promise<string> {
    await this.navigateToFamilySettings();
    
    await this.page.click('button:has-text("Generate Invite"), button:has-text("Create Invite")');
    
    await this.page.waitForSelector('[data-testid="invite-token"], code, .invite-token', { timeout: 5000 });
    
    const tokenElement = this.page.locator('[data-testid="invite-token"], code, .invite-token').first();
    const token = await tokenElement.textContent();
    
    if (!token) {
      throw new Error('Could not retrieve invite token from UI');
    }
    
    return token.trim();
  }

  async copyInviteLink() {
    const copyBtn = this.page.locator('button:has-text("Copy")').first();
    await copyBtn.click();
    
    const notification = this.page.locator('text=Copied');
    await notification.waitFor({ timeout: 3000 });
  }

  async acceptInvite(inviteToken: string, childName: string, childAge: number = 8) {
    const inviteLink = `/invite/${inviteToken}`;
    await this.page.goto(inviteLink);
    await this.page.waitForLoadState('networkidle');
    
    await this.page.fill('input[name="name"]', childName);
    
    const ageInput = this.page.locator('input[name="age"]');
    if (await ageInput.isVisible()) {
      await ageInput.fill(childAge.toString());
    }
    
    await this.page.click('button[type="submit"]:has-text("Create Profile"), button[type="submit"]');
    
    await this.page.waitForLoadState('networkidle');
  }

  async approvePendingChild(childName: string) {
    await this.navigateToApprovals();
    
    const childRow = this.page.locator(`text=${childName}`).locator('..').locator('..').first();
    await childRow.waitFor({ timeout: 5000 });
    
    const approveBtn = childRow.locator('button:has-text("Approve")');
    await approveBtn.click();
    
    const confirmBtn = this.page.locator('button:has-text("Yes"), button:has-text("Confirm")').first();
    await confirmBtn.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async rejectPendingChild(childName: string) {
    await this.navigateToApprovals();
    
    const childRow = this.page.locator(`text=${childName}`).locator('..').locator('..').first();
    await childRow.waitFor({ timeout: 5000 });
    
    const rejectBtn = childRow.locator('button:has-text("Reject")');
    await rejectBtn.click();
    
    const confirmBtn = this.page.locator('button:has-text("Yes"), button:has-text("Confirm")').first();
    await confirmBtn.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async switchFamily(familyName: string) {
    const familySelector = this.page.locator('[data-testid="family-selector"]');
    if (await familySelector.isVisible()) {
      await familySelector.click();
      await this.page.locator(`text=${familyName}`).click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async getWallContent(): Promise<string> {
    const wallContent = this.page.locator('[data-testid="wall-content"], main').first();
    return await wallContent.textContent() || '';
  }

  async verifyFamilyInList(familyName: string) {
    const familyItem = this.page.locator(`text=${familyName}`);
    await expect(familyItem).toBeVisible();
  }

  async verifyChildStatus(childName: string, expectedStatus: 'pending' | 'active' | 'suspended') {
    const childRow = this.page.locator(`text=${childName}`).locator('..').locator('..').first();
    const statusElement = childRow.locator('[data-testid="status"], .status');
    
    const statusText = await statusElement.textContent();
    expect(statusText?.toLowerCase()).toContain(expectedStatus.toLowerCase());
  }

  async getFamilyMembers(): Promise<Array<{ name: string; role: string; status: string }>> {
    await this.navigateToChildren();
    
    const members: Array<{ name: string; role: string; status: string }> = [];
    
    const rows = this.page.locator('[data-testid="member-row"], table tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const nameText = await row.locator('td:first-child').textContent() || '';
      const roleText = await row.locator('td:nth-child(2)').textContent() || '';
      const statusText = await row.locator('td:nth-child(3)').textContent() || '';
      
      members.push({
        name: nameText.trim(),
        role: roleText.trim(),
        status: statusText.trim(),
      });
    }
    
    return members;
  }

  async verifyChildCanAccessWall() {
    await this.navigateToWall();
    const wallVisible = await this.page.locator('[data-testid="wall"], main').first().isVisible();
    expect(wallVisible).toBe(true);
  }

  async verifyChildCannotAccessAdminPanel() {
    const response = await this.page.goto('/admin/moderation', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(403);
  }

  async verifyChildCannotAccessSettings() {
    const response = await this.page.goto('/settings', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(403);
  }

  async verifyChildCannotAccessApprovals() {
    const response = await this.page.goto('/approvals', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(403);
  }

  async leaveFamily() {
    await this.navigateToFamilySettings();
    
    const leaveBtn = this.page.locator('button:has-text("Leave Family")');
    await leaveBtn.click();
    
    const confirmBtn = this.page.locator('button:has-text("Yes"), button:has-text("Confirm")').first();
    await confirmBtn.click();
    
    await this.page.waitForLoadState('networkidle');
  }

  async verifyAuditLogEntry(action: string, details?: string) {
    await this.navigateToAuditLogs();
    
    const logEntry = this.page.locator(`text=${action}`);
    await expect(logEntry).toBeVisible();
    
    if (details) {
      const detailsEntry = this.page.locator(`text=${details}`);
      await expect(detailsEntry).toBeVisible();
    }
  }

  async createPost(content: string) {
    await this.page.fill('textarea[placeholder*="message"], textarea[placeholder*="post"]', content);
    await this.page.click('button[type="submit"]:has-text("Post"), button:has-text("Send")');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPostVisible(content: string) {
    const postElement = this.page.locator(`text=${content}`);
    await expect(postElement).toBeVisible();
  }

  async verifyPostNotVisible(content: string) {
    const postElement = this.page.locator(`text=${content}`);
    await expect(postElement).not.toBeVisible();
  }
}
