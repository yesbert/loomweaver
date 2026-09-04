import { expect, test } from '@playwright/test';

test.describe('Sidebar view stacking', () => {
  const dividers =
    'lw-shell-panel lw-pane-split-handle[aria-orientation="horizontal"]';
  const outlines = 'lw-shell-panel lw-testbed-outline-view';

  test('stacks the same view several times as independent instances, and persists', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .locator('#panel-views-left-panel')
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Stack below' }).click();
    await expect(page.locator(dividers)).toHaveCount(1);
    await expect(page.locator(outlines)).toHaveCount(2);

    await page
      .locator('#panel-views-left-panel')
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Stack below' }).click();
    await expect(page.locator(dividers)).toHaveCount(2);
    await expect(page.locator(outlines)).toHaveCount(3);
    await expect(
      page.getByRole('button', { name: 'Unstack view' }),
    ).toHaveCount(2);

    await page.reload();
    await expect(page.locator(dividers)).toHaveCount(2);
    await expect(page.locator(outlines).first()).toBeVisible();

    await page.getByRole('button', { name: 'Unstack view' }).first().click();
    await expect(page.locator(dividers)).toHaveCount(1);
    await page.getByRole('button', { name: 'Unstack view' }).first().click();
    await expect(page.locator(dividers)).toHaveCount(0);
  });
});
