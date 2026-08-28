import { expect, test } from '@playwright/test';

test.describe('Per-pane tab groups', () => {
  const pane = 'lw-pane-view';

  test('a secondary pane is a tab group: own strip, own active tab, add/switch/close, reload-safe', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator(pane)).toHaveCount(1);
    await expect(page.locator(`${pane} [role="tab"]`)).toHaveCount(1);
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-search-view'),
    ).toBeVisible();

    await page.locator('lw-pane-view').getByTestId('pane-add-tab').click();
    await page.getByRole('menuitem', { name: 'Outline' }).click();
    await expect(page.locator(`${pane} [role="tab"]`)).toHaveCount(2);
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();

    await page.reload();
    await expect(page.locator(`${pane} [role="tab"]`)).toHaveCount(2);
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();

    await page.locator(`${pane} [role="tab"]`).first().click();
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-search-view'),
    ).toBeVisible();

    await page.locator(`${pane}`).getByTestId('tab-close').first().click();
    await expect(page.locator(`${pane} [role="tab"]`)).toHaveCount(1);
  });

  test('the URL group is a tab group too: its open tabs (incl. titles) survive a reload (R10)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    await page.getByRole('button', { name: 'Alpha' }).dblclick();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .dblclick();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();
  });
});
