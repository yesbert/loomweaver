import { expect, test } from '@playwright/test';

test.describe('Content grid', () => {
  test('splits a secondary pane along a second axis, adds a tab, closes, and persists', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page
      .locator('lw-pane-view')
      .getByRole('button', { name: 'Split down' })
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(2);

    await expect(page.locator('lw-pane-split-handle')).toHaveCount(2);
    await expect(
      page.locator('lw-pane-split-handle[aria-orientation="horizontal"]'),
    ).toHaveCount(1);

    await page.reload();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(2);

    await page
      .locator('lw-pane-view')
      .first()
      .getByRole('button', { name: 'Close pane' })
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByTestId('pane-add-tab').first().click();
    await expect(page.locator('lw-menu')).toBeVisible();
  });
});
