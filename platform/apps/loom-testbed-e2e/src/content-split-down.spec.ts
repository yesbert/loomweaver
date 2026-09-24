import { expect, test } from '@playwright/test';

test.describe('Primary content split-down', () => {
  test('splits the primary pane downward into a stacked (column) grid', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-address-pane-header lw-pane-toolbar button[aria-label="Split down"]',
      )
      .click();

    await expect(
      page.locator('lw-pane-split-handle[aria-orientation="horizontal"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('lw-pane-view:not([data-address-pane]) lw-surface-body'),
    ).toHaveCount(1);

    await page.reload();
    await expect(
      page.locator('lw-pane-split-handle[aria-orientation="horizontal"]'),
    ).toHaveCount(1);
  });
});
