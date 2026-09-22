import { expect, test } from '@playwright/test';
import { openEntry } from './support/helpers';

test.describe('A content tab in a split pane opens its menu and acts on that pane', () => {
  test('Close Others in the split pane keeps the chosen tab there and leaves the address-carrying pane alone', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Split right' }).click();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);

    const splitStrip = page.locator(
      'lw-content-grid lw-pane-view:not([data-address-pane]) lw-pane-tab-strip',
    );
    await expect(splitStrip.locator('[role="tab"]')).toHaveCount(2);
    const target = splitStrip.locator('[role="tab"][aria-label="E-02"]');

    await target.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Close Others' }),
    ).toBeVisible();
    await page.getByRole('menuitem', { name: 'Close Others' }).click();

    await expect(splitStrip.locator('[role="tab"]')).toHaveCount(1);
    await expect(target).toBeVisible();
    await expect(
      page.locator('lw-content-area [role="tab"][aria-label="E-01"]'),
    ).toBeVisible();
    await expect(page).toHaveURL(/entry\/e-01/);
  });
});
