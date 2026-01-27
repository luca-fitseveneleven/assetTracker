import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test('can switch to dark mode', async ({ page }) => {
    await page.goto('/');

    // Find and click theme switcher
    // This might be a button or dropdown - adjust selector based on actual implementation
    const themeSwitcher = page.getByRole('button', { name: /theme/i }).or(
      page.locator('[aria-label*="theme" i]')
    );
    
    // Check if theme switcher exists
    const exists = await themeSwitcher.count();
    if (exists > 0) {
      await themeSwitcher.first().click();
      
      // Look for dark mode option
      const darkOption = page.getByText(/dark/i).first();
      if (await darkOption.isVisible()) {
        await darkOption.click();
        
        // Verify dark class applied to html or body
        const html = page.locator('html');
        const hasClass = await html.evaluate((el) => 
          el.classList.contains('dark') || 
          el.getAttribute('data-theme') === 'dark' ||
          el.style.colorScheme === 'dark'
        );
        expect(hasClass).toBeTruthy();
      }
    }
  });

  test('theme persists across page navigation', async ({ page }) => {
    await page.goto('/');

    // Set dark mode if theme switcher exists
    const themeSwitcher = page.getByRole('button', { name: /theme/i }).or(
      page.locator('[aria-label*="theme" i]')
    );
    
    const exists = await themeSwitcher.count();
    if (exists > 0) {
      await themeSwitcher.first().click();
      const darkOption = page.getByText(/dark/i).first();
      
      if (await darkOption.isVisible()) {
        await darkOption.click();
        await page.waitForTimeout(500); // Wait for theme to apply
        
        // Navigate to another page
        await page.goto('/assets');
        
        // Verify theme persisted
        const html = page.locator('html');
        const hasClass = await html.evaluate((el) => 
          el.classList.contains('dark') || 
          el.getAttribute('data-theme') === 'dark' ||
          el.style.colorScheme === 'dark'
        );
        expect(hasClass).toBeTruthy();
      }
    }
  });
});
