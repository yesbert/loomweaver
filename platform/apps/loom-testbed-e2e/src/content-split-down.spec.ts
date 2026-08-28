import { expect, test } from '@playwright/test';

test.describe('Primary content split-down', () => {
  test('splits the primary pane downward into a stacked (column) grid', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split down"]',
      )
      .click();

    await expect(
      page.locator('lw-pane-split-handle[aria-orientation="horizontal"]'),
    ).toHaveCount(1);
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.reload();
    await expect(
      page.locator('lw-pane-split-handle[aria-orientation="horizontal"]'),
    ).toHaveCount(1);
  });
});
