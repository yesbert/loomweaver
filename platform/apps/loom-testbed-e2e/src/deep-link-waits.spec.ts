import { expect, test, Page } from '@playwright/test';

const PANES_KEY = 'lw.shell.pane-trees:testbed.sandbox';
const RAIL_ENTRY = '[data-rail-item="testbed.workspace.sandbox"]';

async function holdThePluginBack(page: Page, ms: number): Promise<void> {
  await page.route('**/sandbox-rpc/plugin.html', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

async function savedContentTabs(page: Page): Promise<readonly string[]> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), PANES_KEY);
  const tabs = JSON.parse(raw ?? '{}')?.content?.tree?.tabs ?? [];
  return tabs.map((tab: { path: string }) => tab.path);
}

async function savedActiveTab(page: Page): Promise<string | undefined> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), PANES_KEY);
  return JSON.parse(raw ?? '{}')?.content?.tree?.active;
}

test.describe('A deep link survives arriving before the plugin that answers it', () => {
  test('an address whose plugin registers later is shown once it does, and reports nothing', async ({
    page,
  }) => {
    const unreachable: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('NG04002')) {
        unreachable.push(message.text());
      }
    });

    await holdThePluginBack(page, 3000);
    await page.goto('/sandbox-rpc');

    await expect(page.locator('iframe[src*="/sandbox-rpc/view.html"]')).toBeAttached({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/sandbox-rpc$/);
    expect(unreachable).toEqual([]);
  });

  test('an address that arrives early leaves the workspace claiming it as it was', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(RAIL_ENTRY).click();
    await expect(page).toHaveURL(/\/sandbox-rpc$/);

    await holdThePluginBack(page, 3000);
    await page.goto('/sandbox-rpc');
    await expect(page.locator('iframe[src*="/sandbox-rpc/view.html"]')).toBeAttached({
      timeout: 15_000,
    });

    expect(await savedContentTabs(page)).toEqual(['sandbox-rpc']);
    expect(await savedActiveTab(page)).toBe('sandbox-rpc');
  });

  test('the workspace is still reached from the rail after such an arrival', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(RAIL_ENTRY).click();

    await holdThePluginBack(page, 3000);
    await page.goto('/sandbox-rpc');
    await expect(page.locator('iframe[src*="/sandbox-rpc/view.html"]')).toBeAttached({
      timeout: 15_000,
    });

    await page.locator('[data-rail-item="testbed.workspace.home"]').click();
    await expect(page).toHaveURL(/\/$/);

    await page.locator(RAIL_ENTRY).click();
    await expect(page).toHaveURL(/\/sandbox-rpc$/);
    await expect(page.locator(RAIL_ENTRY)).toHaveAttribute('aria-current', 'true');
  });

  test('an address nothing ever answers reads as unavailable and leaves nothing behind', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(RAIL_ENTRY).click();

    await page.route('**/sandbox-rpc/plugin.html', (route) => route.abort());
    await page.goto('/sandbox-rpc');

    await expect(page.getByText(/not available/i).first()).toBeVisible({
      timeout: 15_000,
    });
    expect(await savedContentTabs(page)).toEqual(['sandbox-rpc']);
    expect(await savedActiveTab(page)).toBe('sandbox-rpc');
  });
});
