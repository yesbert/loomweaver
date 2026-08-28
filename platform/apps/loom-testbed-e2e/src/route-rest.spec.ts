import { expect, test } from '@playwright/test';

const SURFACE = 'iframe[src*="/sandbox-static/view.html"]';

test.describe('Plugin-owned routing — a prefix and its rest', () => {
  test('a deep address under the prefix reaches the surface and hands over the rest', async ({
    page,
  }) => {
    await page.goto('/sandbox-static/programs/205470/pricing');

    await expect(page).toHaveURL(/sandbox-static\/programs\/205470\/pricing/);
    const surface = page.frameLocator(SURFACE);
    await expect(surface.locator('#rest')).toHaveText(
      'programs/205470/pricing',
    );
  });

  test('the query string crosses verbatim', async ({ page }) => {
    await page.goto('/sandbox-static/programs/205470?treaty=886320');

    const surface = page.frameLocator(SURFACE);
    await expect(surface.locator('#rest')).toHaveText(
      'programs/205470?treaty=886320',
    );
  });

  test('the whole subtree stays one tab, and the surface may set its own rest', async ({
    page,
  }) => {
    await page.goto('/sandbox-static');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (static tab)' }),
    ).toBeVisible();

    const surface = page.frameLocator(SURFACE);
    await surface.getByRole('button', { name: 'Deeper, with a query' }).click();

    await expect(page).toHaveURL(/pricing\?treaty=886320/);
    await expect(surface.locator('#rest')).toHaveText(
      'programs/205470/pricing?treaty=886320',
    );
    await expect(
      page.getByRole('tab', { name: 'Sandbox (static tab)' }),
    ).toHaveCount(1);

    await page.goBack();
    await expect(surface.locator('#rest')).toHaveText('(none)');
  });
});
