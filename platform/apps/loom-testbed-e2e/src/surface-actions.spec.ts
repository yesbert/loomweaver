import { expect, test } from '@playwright/test';

test.describe("A content surface's own actions", () => {
  test('are drawn in the header of the pane that shows it, and go with it', async ({
    page,
  }) => {
    await page.goto('/search');
    const actions = page
      .locator('lw-address-pane-header')
      .getByTestId('surface-actions');

    await expect(actions.locator('[data-surface-action]')).toHaveCount(4);
    await expect(
      actions.locator('[data-surface-action="testbed.search.home"]'),
    ).toBeVisible();
    await expect(
      actions.getByRole('button', { name: 'Back to the start page' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Home', exact: true }),
    ).toHaveCount(1);

    await actions.locator('[data-surface-action="testbed.search.home"]').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.locator('[data-surface-action="testbed.search.home"]'),
    ).toHaveCount(0);
  });

  test('a split pane draws them too, before its own controls', async ({
    page,
  }) => {
    await page.goto('/search');
    await page
      .locator(
        'lw-address-pane-header lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();

    const second = page.locator('lw-pane-view:not([data-address-pane])');
    const action = second.locator('[data-surface-action="testbed.search.home"]');
    await expect(action).toBeVisible();
    await expect(
      page.locator('[data-surface-action="testbed.search.home"]'),
    ).toHaveCount(2);

    const actionBox = await action.boundingBox();
    const closeBox = await second
      .getByRole('button', { name: 'Close pane' })
      .boundingBox();
    expect(actionBox?.x).toBeLessThan(closeBox?.x ?? 0);
  });

  test('an action with a command of its own runs it while its menu is empty', async ({
    page,
  }) => {
    await page.goto('/search');
    const alone = page.locator('[data-surface-action="testbed.search.alone"]');

    await expect(alone).toBeVisible();
    await expect(alone).not.toHaveAttribute('aria-haspopup', 'menu');
    await alone.click();

    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole('menu')).toHaveCount(0);
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
