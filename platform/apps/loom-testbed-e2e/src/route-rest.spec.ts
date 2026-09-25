import { expect, test } from '@playwright/test';

const SURFACE = 'iframe[src*="/sandbox-rest/view.html"]';

test.describe('Plugin-owned routing — a prefix and its rest', () => {
  test('a deep address under the prefix reaches the surface and hands over the rest', async ({
    page,
  }) => {
    await page.goto('/sandbox-rest/guide/setup');

    await expect(page).toHaveURL(/sandbox-rest\/guide\/setup/);
    const surface = page.frameLocator(SURFACE);
    await expect(surface.locator('#rest')).toHaveText('guide/setup');
  });

  test('the query string crosses verbatim', async ({ page }) => {
    await page.goto('/sandbox-rest/guide?step=2');

    const surface = page.frameLocator(SURFACE);
    await expect(surface.locator('#rest')).toHaveText('guide?step=2');
  });

  test('the whole subtree stays one tab, and the surface may set its own rest', async ({
    page,
  }) => {
    await page.goto('/sandbox-rest');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (rest route)' }),
    ).toBeVisible();

    const surface = page.frameLocator(SURFACE);
    await surface.getByRole('button', { name: 'Deeper, with a query' }).click();

    await expect(page).toHaveURL(/setup\?step=2/);
    await expect(surface.locator('#rest')).toHaveText('guide/setup?step=2');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (rest route)' }),
    ).toHaveCount(1);

    await page.goBack();
    await expect(surface.locator('#rest')).toHaveText('(none)');
  });
});
