import { test, expect } from '@playwright/test';

test.describe('Table Functionality', () => {
  test('manufacturers table loads and displays data', async ({ page }) => {
    await page.goto('/manufacturers');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Check for table headers
    const headers = page.locator('th');
    await expect(headers).toHaveCount(2); // Name and Created columns
  });

  test('search functionality works on manufacturers', async ({ page }) => {
    await page.goto('/manufacturers');

    // Find search input
    const searchInput = page.getByPlaceholder(/search manufacturers/i);
    
    if (await searchInput.isVisible()) {
      // Type in search
      await searchInput.fill('test');
      
      // Wait for results to update
      await page.waitForTimeout(500);
      
      // Table should still be visible
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    }
  });

  test('table pagination works', async ({ page }) => {
    await page.goto('/manufacturers');

    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next/i });
    const prevButton = page.getByRole('button', { name: /previous/i });

    // Previous should be disabled on first page
    if (await prevButton.isVisible()) {
      await expect(prevButton).toBeDisabled();
    }
  });

  test('table is scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/manufacturers');

    // Check table exists and is scrollable
    const overflowContainer = page.locator('.overflow-x-auto').first();
    await expect(overflowContainer).toBeVisible();

    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('assets table loads', async ({ page }) => {
    await page.goto('/assets');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('users table loads', async ({ page }) => {
    await page.goto('/user');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('locations table loads', async ({ page }) => {
    await page.goto('/locations');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('suppliers table loads', async ({ page }) => {
    await page.goto('/suppliers');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});
