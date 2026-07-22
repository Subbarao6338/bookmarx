import { test, expect } from '@playwright/test';

test('app loads and shows title', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveTitle(/Epic Toolbox/);

  // Checks that the app title is displayed in either mobile header or desktop sidebar
  const titleLocator = page.locator('h1.page-title, h1.sidebar-title').filter({ visible: true });
  await expect(titleLocator).toContainText('NECS Bookmarks');
});

test('can open settings modal', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click the settings button in either the mobile tab bar or the desktop sidebar
  const settingsButton = page.locator('button:has-text("Settings"), button[title="Settings"]').filter({ visible: true }).first();
  await settingsButton.click();

  // Verify settings modal is open
  await expect(page.locator('.modal h2')).toContainText('Settings');
});
