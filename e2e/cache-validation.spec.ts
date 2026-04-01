import { test, expect } from '@playwright/test';

test.describe('Cache and Data Consistency', () => {
  test.beforeEach(async ({ page }) => {
    // We navigate to /home assuming auth state is handled by auth.setup.ts
    await page.goto('/home');
  });

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveURL(/.*home/);
  });
});
