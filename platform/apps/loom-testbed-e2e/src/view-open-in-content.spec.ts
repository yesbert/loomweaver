import { expect, test } from '@playwright/test';

test.describe('Open view in content', () => {
  test('opens a sidebar view in a content pane from its tab context menu', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Outline' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Open in content' }).click();

    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();
  });
});
