import { expect, test } from '@playwright/test';

test.describe('View in a content pane', () => {
  test('adds a sidebar view as a tab in a content pane and persists it', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await page.locator('lw-pane-view').getByTestId('pane-add-tab').click();
    await page.getByRole('menuitem', { name: 'Outline' }).click();

    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();
    await expect(
      page.locator('lw-pane-view [role="tab"][aria-label="Outline"]'),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();
  });
});
