import { test, expect } from '@playwright/test';

test.describe('Responsive Layouts', () => {
  const breakpoints = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const { name, width, height } of breakpoints) {
    test(`${name} layout renders correctly`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // Check no horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      // Allow 1px tolerance for rounding
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test(`${name} - stat cards render`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // Check that stat cards are visible
      const cards = page.locator('[class*="Card"]').or(page.locator('div').filter({ hasText: /total/i }));
      const cardCount = await cards.count();
      
      // Should have at least some stat cards on dashboard
      expect(cardCount).toBeGreaterThan(0);
    });
  }

  test('tables are scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/assets');

    // Check for overflow container
    const overflowContainer = page.locator('.overflow-x-auto').first();
    await expect(overflowContainer).toBeVisible();
  });

  test('mobile menu is accessible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /open menu/i });
    await expect(menuButton).toBeVisible();
  });

  test('desktop navigation is visible on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Desktop navigation should be visible
    const desktopNav = page.locator('nav .hidden.lg\\:flex');
    await expect(desktopNav).toBeVisible();
  });
});
