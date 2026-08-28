import { expect, test } from '@playwright/test';

test.describe('Pane minimize', () => {
  test('a secondary pane collapses to a strip and clicking it restores', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).first().dblclick();
    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);

    const strip = page.getByTestId('pane-minimized-strip');
    await expect(strip).toHaveCount(0);

    await page.locator('lw-pane-view').getByTestId('pane-minimize').click();

    await expect(strip).toHaveCount(1);
    await expect(page.locator('lw-pane-view')).toHaveCount(0);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);

    await expect
      .poll(async () => (await strip.boundingBox())!.width)
      .toBeLessThan(120);

    await strip.click();
    await expect(page.getByTestId('pane-minimized-strip')).toHaveCount(0);
    await expect(page.locator('lw-pane-view')).toHaveCount(1);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
  });

  test('a minimized pane holding several tabs shows a tab-count badge', async ({
    page,
  }) => {
    await page.goto('/search');
    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    const pane = page.locator('lw-pane-view');
    await expect(pane).toHaveCount(1);

    await page.locator('lw-pane-view').getByTestId('pane-add-tab').click();
    await page.getByRole('menuitem', { name: 'Outline' }).click();
    await expect(pane.locator('[role="tab"]')).toHaveCount(2);

    await pane.getByTestId('pane-minimize').click();
    const strip = page.getByTestId('pane-minimized-strip');
    await expect(strip).toHaveCount(1);
    await expect(strip.locator('.lw-badge')).toHaveText('+1');
  });
});
