import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Open mobile menu
    const menuButton = page.getByRole('button', { name: /open menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Click Assets link in mobile menu
    const assetsLink = page.getByRole('link', { name: 'Assets' }).first();
    await expect(assetsLink).toBeVisible();
    await assetsLink.click();
    
    await expect(page).toHaveURL(/\/assets/);
  });

  test('desktop navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Desktop nav should be visible
    const desktopNav = page.locator('nav').first();
    await expect(desktopNav).toBeVisible();
    
    // Click Assets link
    await page.getByRole('link', { name: 'Assets' }).first().click();
    await expect(page).toHaveURL(/\/assets/);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Sidebar should be visible on desktop
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Should have navigation items
    await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Users' })).toBeVisible();
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Sidebar should be hidden on mobile
    const sidebar = page.locator('aside');
    await expect(sidebar).not.toBeVisible();
  });
});
