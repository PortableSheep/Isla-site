import { Page } from '@playwright/test';

/**
 * Page Object for Settings/Preferences
 * Handles user settings, profile updates, and preferences management
 */
export class SettingsPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    // Try multiple possible settings URLs
    const urls = ['/dashboard/settings', '/settings', '/account/settings', '/profile/settings'];
    
    for (const url of urls) {
      const response = await this.page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
      if (response?.ok()) {
        return;
      }
    }
    
    throw new Error('Could not navigate to settings page');
  }

  async goToSecuritySettings(): Promise<void> {
    const urls = ['/dashboard/settings/security', '/settings/security', '/account/security'];
    
    for (const url of urls) {
      const response = await this.page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
      if (response?.ok()) {
        return;
      }
    }
    
    // Try clicking security tab if URL navigation fails
    const securityTab = this.page.locator('[data-testid="security-tab"], button:has-text("Security"), a:has-text("Security")').first();
    if (await securityTab.isVisible()) {
      await securityTab.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async goToNotificationSettings(): Promise<void> {
    const urls = ['/dashboard/settings/notifications', '/settings/notifications', '/account/notifications'];
    
    for (const url of urls) {
      const response = await this.page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
      if (response?.ok()) {
        return;
      }
    }
    
    // Try clicking notifications tab if URL navigation fails
    const notificationsTab = this.page.locator('[data-testid="notifications-tab"], button:has-text("Notifications"), a:has-text("Notifications")').first();
    if (await notificationsTab.isVisible()) {
      await notificationsTab.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async updateProfilePicture(filePath: string): Promise<void> {
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');

    // Look for upload/save button
    const saveBtn = this.page.locator('button:has-text("Save"), button:has-text("Upload"), button:has-text("Update")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async toggleNotifications(enable: boolean): Promise<void> {
    const toggle = this.page.locator('[data-testid="notifications-toggle"], input[type="checkbox"][aria-label*="notification"]').first();
    
    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      
      if (enable && !isChecked) {
        await toggle.click();
      } else if (!enable && isChecked) {
        await toggle.click();
      }
    }
  }

  async toggleEmailNotifications(enable: boolean): Promise<void> {
    const toggle = this.page.locator('[data-testid="email-notifications"], input[type="checkbox"][aria-label*="email"]').first();
    
    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      
      if (enable && !isChecked) {
        await toggle.click();
      } else if (!enable && isChecked) {
        await toggle.click();
      }
    }
  }

  async setEmailFrequency(frequency: 'instant' | 'daily' | 'weekly' | 'never'): Promise<void> {
    const frequencySelect = this.page.locator('[data-testid="email-frequency"], select').first();
    
    if (await frequencySelect.isVisible()) {
      await frequencySelect.selectOption(frequency);
    }
  }

  async toggleDarkMode(enable: boolean): Promise<void> {
    const darkModeToggle = this.page.locator('[data-testid="dark-mode-toggle"], input[type="checkbox"][aria-label*="Dark"], input[type="checkbox"][aria-label*="dark"]').first();
    
    if (await darkModeToggle.isVisible()) {
      const isChecked = await darkModeToggle.isChecked();
      
      if (enable && !isChecked) {
        await darkModeToggle.click();
      } else if (!enable && isChecked) {
        await darkModeToggle.click();
      }
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const changePasswordBtn = this.page.locator('button:has-text("Change Password"), button:has-text("Update Password")').first();
    
    if (await changePasswordBtn.isVisible()) {
      await changePasswordBtn.click();
      await this.page.waitForTimeout(500);
    }

    // Fill current password
    const currentPasswordInput = this.page.locator('input[type="password"][placeholder*="Current"], input[type="password"][placeholder*="Old"]').first();
    if (await currentPasswordInput.isVisible()) {
      await currentPasswordInput.fill(currentPassword);
    }

    // Fill new passwords
    const passwordInputs = this.page.locator('input[type="password"]');
    const inputs = await passwordInputs.all();
    
    if (inputs.length >= 3) {
      // Typically: current, new, confirm
      await inputs[1].fill(newPassword);
      await inputs[2].fill(newPassword);
    } else if (inputs.length >= 2) {
      await inputs[0].fill(newPassword);
      await inputs[1].fill(newPassword);
    }
  }

  async saveSettings(): Promise<void> {
    const saveBtn = this.page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Save Changes")').first();
    
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async getSaveSuccessMessage(): Promise<string | null> {
    try {
      const successMsg = this.page.locator('[data-testid="settings-saved"], .success-message, text=/saved|updated/i').first();
      await successMsg.waitFor({ state: 'visible', timeout: 5000 });
      return await successMsg.textContent();
    } catch {
      return null;
    }
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      const errorMsg = this.page.locator('[data-testid="settings-error"], .error-message, [role="alert"]').first();
      await errorMsg.waitFor({ state: 'visible', timeout: 5000 });
      return await errorMsg.textContent();
    } catch {
      return null;
    }
  }

  async deleteAccount(): Promise<void> {
    const deleteBtn = this.page.locator('button:has-text("Delete Account"), button:has-text("Delete"), button[class*="danger"]').first();
    
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await this.page.waitForTimeout(500);

      // Confirm deletion in modal if it appears
      const confirmBtn = this.page.locator('button:has-text("Delete"), button:has-text("Confirm"), button[class*="danger"]').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  }

  async viewAuditLog(): Promise<void> {
    const auditLogLink = this.page.locator('[data-testid="audit-log"], a:has-text("Audit"), a:has-text("Activity"), button:has-text("Activity")').first();
    
    if (await auditLogLink.isVisible()) {
      await auditLogLink.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async getAuditLogEntries(): Promise<string[]> {
    const entries = await this.page.locator('[data-testid="audit-entry"], .audit-log-entry, tbody tr').allTextContents();
    return entries;
  }
}
