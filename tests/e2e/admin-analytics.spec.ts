import { test, expect } from '@playwright/test';

/**
 * /admin/analytics smoke tests.
 *
 * Confirms:
 *   1. Anonymous users are redirected away from /admin/analytics.
 *   2. Anonymous calls to /api/admin/analytics/summary return 401.
 *
 * Full admin-flow coverage (login as admin, see stat cards, switch
 * timeframe) depends on seeded admin credentials and is intentionally
 * skipped here unless `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are set
 * in the environment.
 */

test.describe('/admin/analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('redirects unauthenticated users away from /admin/analytics', async ({ page }) => {
    const response = await page.goto('/admin/analytics');

    // Either a server redirect (to /auth/login) or a client-side bounce
    // to "/" from the is_admin check. Either is acceptable — we just
    // must not land on the analytics page itself.
    await page.waitForLoadState('networkidle');
    expect(response?.status() ?? 0).toBeLessThan(500);
    const url = new URL(page.url());
    expect(url.pathname).not.toBe('/admin/analytics');
  });

  test('GET /api/admin/analytics/summary rejects anonymous requests', async ({ request }) => {
    const res = await request.get('/api/admin/analytics/summary?timeframe=7d');
    expect([401, 403]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    expect(body).toHaveProperty('error');
  });

  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  test('admin sees the analytics dashboard', async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set');

    await page.goto('/auth/login');
    await page.locator('input[type="email"]').fill(adminEmail!);
    await page.locator('input[type="password"]').fill(adminPassword!);
    await page.locator('button:has-text("Sign In")').click();

    await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 15_000 });
    await page.goto('/admin/analytics');

    await expect(page.getByRole('heading', { name: /site analytics/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/visitors \(24h\)/i)).toBeVisible();
    await expect(page.getByRole('tab', { name: '7 days' })).toBeVisible();

    await page.getByRole('tab', { name: '7 days' }).click();
    await expect(page.getByRole('tab', { name: '7 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
