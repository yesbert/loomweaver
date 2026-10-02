import { expect, test } from '@playwright/test';

test.describe("A content surface's own actions", () => {
  test('are drawn in the header of the pane that shows it, and go with it', async ({
    page,
  }) => {
    await page.goto('/search');
    const actions = page
      .locator('lw-address-pane-header')
      .getByTestId('surface-actions');

    await expect(actions.locator('[data-surface-action]')).toHaveCount(2);
    await expect(
      actions.locator('[data-surface-action="testbed.search.home"]'),
    ).toBeVisible();

    await actions.locator('[data-surface-action="testbed.search.home"]').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.locator('[data-surface-action="testbed.search.home"]'),
    ).toHaveCount(0);
  });

  test('an action opens its menu on activation, and one whose menu is empty is not drawn', async ({
    page,
  }) => {
    await page.goto('/search');
    const more = page.locator('[data-surface-action="testbed.search.more"]');

    await expect(more).toHaveAttribute('aria-haspopup', 'menu');
    await expect(
      page.locator('[data-surface-action="testbed.search.unfilled"]'),
    ).toHaveCount(0);

    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('menuitem', { name: 'Notes' }).click();

    await expect(page).toHaveURL(/\/notes$/);
  });
});
