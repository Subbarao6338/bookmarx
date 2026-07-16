import { test, expect } from '@playwright/test';

test.describe('PocketBase Cloud Sync and Connection Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable service worker registration to prevent cache interception during E2E testing
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'serviceWorker', {
        get() { return undefined; },
        configurable: true
      });
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('request', req => console.log('PAGE REQUEST:', req.method(), req.url()));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
  });

  test('should set hub_pb_connected to true on successful health check and false on URL change', async ({ page }) => {
    const mockPBUrl = 'http://mock-pb.local';

    // Mock the PocketBase health check endpoint using a RegExp
    await page.route(/\/api\/health/, async (route) => {
      console.log('INTERCEPTED health check route:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, status: 200, message: 'OK' }),
      });
    });

    // Prefill the pocketbase connection URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem('hub_pb_url', url);
    }, mockPBUrl);

    // Open the application
    await page.goto('/');

    // Wait for the application to load and find the settings button in tab bar
    const settingsButton = page.locator('button[title="Settings"]');
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.click();

    // Verify Settings is open by checking for header
    const settingsHeader = page.locator('h2:has-text("Settings")');
    await settingsHeader.waitFor({ state: 'visible', timeout: 5000 });

    // Expand PocketBase Remote Sync section if collapsed
    const pocketbaseHeader = page.locator('.collapsible-header:has-text("PocketBase Remote Sync")');
    await pocketbaseHeader.waitFor({ state: 'visible', timeout: 5000 });

    const isPocketbaseOpen = await page.locator('.settings-collapsible:has-text("PocketBase Remote Sync")').evaluate(el => el.classList.contains('is-open'));
    if (!isPocketbaseOpen) {
      await pocketbaseHeader.click();
    }

    // Verify URL input is prefilled
    const urlInput = page.locator('input[placeholder="https://my-pocketbase.pockethost.io"]');
    await expect(urlInput).toHaveValue(mockPBUrl);

    // Click the "Test" connection button
    const testButton = page.locator('button:has-text("Test")');
    await testButton.click();

    // Verify success status text
    await expect(page.locator('text=Connected successfully!')).toBeVisible();

    // Verify localStorage hub_pb_connected is 'true'
    let connectedFlag = await page.evaluate(() => localStorage.getItem('hub_pb_connected'));
    expect(connectedFlag).toBe('true');

    // Modify PocketBase Instance URL
    await urlInput.fill('http://another-mock-pb.local');

    // Verify localStorage hub_pb_connected is reset to 'false'
    connectedFlag = await page.evaluate(() => localStorage.getItem('hub_pb_connected'));
    expect(connectedFlag).toBe('false');
  });

  test('should prevent sync and show error if not connected or authenticated', async ({ page }) => {
    const mockPBUrl = 'http://mock-pb.local';

    // Open the application
    await page.goto('/');

    // Open Settings
    const settingsButton = page.locator('button[title="Settings"]');
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.click();

    // Expand PocketBase section
    const pocketbaseHeader = page.locator('.collapsible-header:has-text("PocketBase Remote Sync")');
    await pocketbaseHeader.waitFor({ state: 'visible', timeout: 5000 });

    const isPocketbaseOpen = await page.locator('.settings-collapsible:has-text("PocketBase Remote Sync")').evaluate(el => el.classList.contains('is-open'));
    if (!isPocketbaseOpen) {
      await pocketbaseHeader.click();
    }

    // Fill URL but DO NOT test it (so hub_pb_connected is false/unset)
    const urlInput = page.locator('input[placeholder="https://my-pocketbase.pockethost.io"]');
    await urlInput.fill(mockPBUrl);

    // Click "Push Local to Cloud"
    const pushButton = page.locator('button:has-text("Push Local to Cloud")');
    await pushButton.click();

    // Verify error message from sync instance helper returning null
    await expect(page.locator('text=PocketBase is not connected or authenticated.')).toBeVisible();
  });

  test('should allow push sync without admin credentials if hub_pb_connected is true and URL is prefilled', async ({ page }) => {
    const mockPBUrl = 'http://mock-pb.local';

    // Mock PocketBase API health check using a RegExp
    await page.route(/\/api\/health/, async (route) => {
      console.log('INTERCEPTED health check route:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, status: 200, message: 'OK' }),
      });
    });

    // Mock the collections fetch and create endpoints using a RegExp
    await page.route(/\/api\/collections\/bookmarks\/records/, async (route) => {
      console.log('INTERCEPTED collection route:', route.request().method(), route.request().url());
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [] }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: '123', local_id: 'test' }),
        });
      }
    });

    // Prefill the pocketbase connection URL in localStorage
    await page.addInitScript((url) => {
      localStorage.setItem('hub_pb_url', url);
    }, mockPBUrl);

    // Open the application
    await page.goto('/');

    // Open Settings
    const settingsButton = page.locator('button[title="Settings"]');
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 });
    await settingsButton.click();

    // Expand PocketBase section
    const pocketbaseHeader = page.locator('.collapsible-header:has-text("PocketBase Remote Sync")');
    await pocketbaseHeader.waitFor({ state: 'visible', timeout: 5000 });

    const isPocketbaseOpen = await page.locator('.settings-collapsible:has-text("PocketBase Remote Sync")').evaluate(el => el.classList.contains('is-open'));
    if (!isPocketbaseOpen) {
      await pocketbaseHeader.click();
    }

    // Verify URL is prefilled
    const urlInput = page.locator('input[placeholder="https://my-pocketbase.pockethost.io"]');
    await expect(urlInput).toHaveValue(mockPBUrl);

    // Test connection so hub_pb_connected becomes true
    const testButton = page.locator('button:has-text("Test")');
    await testButton.click();
    await expect(page.locator('text=Connected successfully!')).toBeVisible();

    // Click "Push Local to Cloud"
    const pushButton = page.locator('button:has-text("Push Local to Cloud")');
    await pushButton.click();

    // Verify success message
    await expect(page.locator('text=Successfully pushed data!')).toBeVisible();
  });
});
