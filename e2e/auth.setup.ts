import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/login');

  // Fill in credentials (placeholders)
  // These will be provided by the user later
  await page.getByPlaceholder('pat@example.com').fill('admin@test.com');
  await page.getByPlaceholder('********').fill('password123');

  // Click login
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  // Wait for navigation to home/dashboard
  await page.waitForURL('**/home');

  // Alternatively, verify a specific element that appears after login
  // await expect(page.getByText('Dashboard')).toBeVisible();

  // Save the authentication state
  await page.context().storageState({ path: authFile });
});
