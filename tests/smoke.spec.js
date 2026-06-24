import { test, expect } from '@playwright/test';

test('app loads and shows title', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveTitle(/Epic Toolbox/);
  await expect(page.locator('h1.page-title')).toContainText('NECS Bookmarks');
});

test('can open settings modal', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button[title="Settings"]');
  await expect(page.locator('.modal h2')).toContainText('Settings');
});
