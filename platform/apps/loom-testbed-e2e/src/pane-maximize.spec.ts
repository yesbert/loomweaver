import { expect, test } from '@playwright/test';

test.describe('Pane maximize', () => {
  test('fills the whole viewport over all chrome and Escape restores', async ({
    page,
  }) => {
    await page.goto('/search');
    const grid = page.locator('lw-content-grid');
    const vp = page.viewportSize()!;

    const before = (await grid.boundingBox())!;
    expect(before.x).toBeGreaterThan(0);
    expect(before.y).toBeGreaterThan(0);

    const maximize = page.getByTestId('pane-maximize').first();
    await expect(maximize).toBeVisible();
    await maximize.click();

    await expect(grid).toHaveClass(/fixed/);
    const max = (await grid.boundingBox())!;
    expect(max.x).toBeLessThanOrEqual(1);
    expect(max.y).toBeLessThanOrEqual(1);
    expect(max.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(max.height).toBeGreaterThanOrEqual(vp.height - 1);

    await page.keyboard.press('Escape');
    await expect(grid).not.toHaveClass(/fixed/);
    expect((await grid.boundingBox())!.x).toBeGreaterThan(0);
  });

  test('a secondary pane maximizes over everything too', async ({ page }) => {
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

    const grid = page.locator('lw-content-grid');
    const vp = page.viewportSize()!;
    await page
      .locator('lw-pane-view')
      .getByTestId('pane-maximize')
      .first()
      .click();

    await expect(grid).toHaveClass(/fixed/);
    const max = (await grid.boundingBox())!;
    expect(max.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(max.height).toBeGreaterThanOrEqual(vp.height - 1);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(grid).not.toHaveClass(/fixed/);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
  });
});
