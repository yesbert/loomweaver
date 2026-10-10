import { expect, test } from '@playwright/test';
import { startupNoticeGone } from './support/helpers';

test.describe('Notices of a sandboxed plugin', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'lw.shell.installed-plugins',
        JSON.stringify([
          {
            id: 'store-full',
            name: 'Store plugin (full)',
            entryUrl: '/store-full/plugin.html',
            version: '1.0.0',
            capabilities: ['contributions', 'ui'],
          },
        ]),
      );
    });
    await page.goto('/');
    await startupNoticeGone(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('button', { name: 'Plugin store', exact: true })
      .click();
    await page.getByTestId('store-settings-store-full').click();
  });

  test('a burst beyond what the plugin may hold shows three and refuses the rest', async ({
    page,
  }) => {
    const refusals: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('[store-full] toast failed')) {
        refusals.push(message.text());
      }
    });
    const greeting = page.getByLabel('Greeting');
    for (const text of ['one', 'two', 'three', 'four', 'five']) {
      await greeting.fill(text);
    }

    for (const text of ['one', 'two', 'three']) {
      await expect(page.getByText(`[store-full] ${text}`)).toBeVisible();
    }
    await expect.poll(() => refusals.length).toBe(2);
    await expect(page.getByText('[store-full] four')).toHaveCount(0);
    await expect(page.getByText('[store-full] five')).toHaveCount(0);
  });

  test('the same notice raised again is counted on the first', async ({
    page,
  }) => {
    const greeting = page.getByLabel('Greeting');
    await greeting.fill('again');
    await page.getByLabel('Shout').click();
    await page.getByLabel('Shout').click();

    const repeated = page
      .getByRole('status')
      .filter({ hasText: /\[store-full\] again/ });
    await expect(repeated).toHaveCount(1);
    await expect(repeated).toContainText('Raised 2 times');
  });

  test('repeating a notice does not keep it past its first lifetime', async ({
    page,
  }) => {
    const greeting = page.getByLabel('Greeting');
    const shout = page.getByLabel('Shout');
    await greeting.fill('kept');
    await shout.click();
    await shout.click();
    const repeated = page
      .getByRole('status')
      .filter({ hasText: /\[store-full\] kept/ });
    await expect(repeated).toContainText('Raised 2 times');
    await page.mouse.move(0, 0);

    await page.waitForTimeout(3000);
    await shout.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');

    await expect(repeated).toHaveCount(0, { timeout: 4000 });
  });

  test("the plugin's notices leave by themselves", async ({ page }) => {
    await page.getByLabel('Greeting').fill('brief');
    await expect(page.getByText('[store-full] brief')).toBeVisible();
    await page.mouse.move(0, 0);

    await expect(page.getByText('[store-full] brief')).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});
