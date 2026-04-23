import { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;

  // Signup page locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly signInLink: Locator;
  readonly createAccountLink: Locator;
  readonly forgotPasswordLink: Locator;

  // Password reset page locators
  readonly resetPasswordEmailInput: Locator;
  readonly resetPasswordButton: Locator;
  readonly resetSuccessMessage: Locator;

  // Password confirm reset page locators
  readonly newPasswordInput: Locator;
  readonly confirmNewPasswordInput: Locator;
  readonly updatePasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Generic form inputs
    this.emailInput = page.locator('input[type="email"]').first();
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.newPasswordInput = page.locator('input[type="password"]').first();
    this.confirmNewPasswordInput = page.locator('input[type="password"]').nth(1);

    // Buttons
    this.submitButton = page.locator('button[type="submit"]');
    this.resetPasswordButton = page.locator('button[type="submit"]');
    this.updatePasswordButton = page.locator('button[type="submit"]');

    // Messages
    this.errorMessage = page.locator('div:has-text("error"), div[class*="red"]').filter({
      has: page.locator('text=/Email|password|required|valid/i'),
    });
    this.successMessage = page.locator('div:has-text("success"), div[class*="green"]');
    this.resetSuccessMessage = page.locator('div:has-text("Check Your Email")');

    // Links
    this.signInLink = page.locator('a:has-text("Sign in")');
    this.createAccountLink = page.locator('a:has-text("Create one")');
    this.forgotPasswordLink = page.locator('a:has-text("Forgot password")');
  }

  async navigateToSignUp() {
    await this.page.goto('/auth/signup');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToLogin() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToResetPassword() {
    await this.page.goto('/auth/reset-password');
    await this.page.waitForLoadState('networkidle');
  }

  async fillSignUpForm(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillResetPasswordForm(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPasswordResetConfirmForm(password: string, confirmPassword: string) {
    await this.newPasswordInput.fill(password);
    await this.confirmNewPasswordInput.fill(confirmPassword);
  }

  async submitForm() {
    await this.submitButton.click();
    // Wait for either success or error message to appear
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // If neither appears, wait for navigation
      return this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    });
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async getSuccessMessage(): Promise<string | null> {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.successMessage.textContent();
    } catch {
      return null;
    }
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL('**/auth/reset-password');
  }

  async clickSignInLink() {
    await this.signInLink.click();
    await this.page.waitForURL('**/auth/login');
  }

  async clickCreateAccountLink() {
    await this.createAccountLink.click();
    await this.page.waitForURL('**/auth/signup');
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async getPageTitle(): Promise<string | null> {
    return await this.page.locator('h1').first().textContent();
  }
}
