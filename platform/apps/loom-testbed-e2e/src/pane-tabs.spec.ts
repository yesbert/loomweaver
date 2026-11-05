import { Locator, Page, expect, test } from '@playwright/test';

async function paneBesideTheAddress(page: Page): Promise<Locator> {
  const stripId = await page
    .locator(
      'lw-pane-view:not([data-address-pane]) [role="tablist"][id^="pane-strip:content:"]',
    )
    .getAttribute('id');
  return page
    .locator('lw-pane-view')
    .filter({ has: page.locator(`[id="${stripId}"]`) });
}

test.describe('Per-pane tab groups', () => {
  test('a secondary pane is a tab group: own strip, own active tab, add/switch/close, reload-safe', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-address-pane-header lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(
      page.locator('lw-pane-view:not([data-address-pane])'),
    ).toHaveCount(1);
    const secondary = await paneBesideTheAddress(page);
    const tabs = secondary.getByRole('tab');
    await expect(tabs).toHaveCount(1);
    await expect(
      secondary.locator('lw-surface-body lw-testbed-search-view'),
    ).toBeVisible();

    await secondary.getByTestId('pane-add-tab').click();
    await page.getByRole('menuitem', { name: 'Outline' }).click();
    await expect(tabs).toHaveCount(2);
    await expect(
      secondary.locator('lw-surface-body lw-testbed-outline-view'),
    ).toBeVisible();

    await page.reload();
    await expect(tabs).toHaveCount(2);
    await expect(
      secondary.locator('lw-surface-body lw-testbed-outline-view'),
    ).toBeVisible();

    await tabs.first().click();
    await expect(
      secondary.locator('lw-surface-body lw-testbed-search-view'),
    ).toBeVisible();
    await expect(secondary).toHaveAttribute('data-address-pane');

    await secondary.getByTestId('tab-close').first().click();
    await expect(tabs).toHaveCount(1);
    await expect(secondary.getByRole('tab', { name: 'Outline' })).toBeVisible();
    await expect(page.locator('lw-content-grid lw-pane-view')).toHaveCount(2);
  });

  test('the URL group is a tab group too: its open tabs (incl. titles) survive a reload', async ({
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
