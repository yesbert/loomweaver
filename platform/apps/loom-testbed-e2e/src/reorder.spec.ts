import { expect, test, type Page } from '@playwright/test';
import { dragTo } from './support/helpers';

async function openTwoEntries(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Entry list' }).click();
  await page.getByRole('button', { name: 'Alpha' }).dblclick();
  await expect(page).toHaveURL(/entry\/e-01/);
  await page.getByRole('button', { name: 'Bravo' }).dblclick();
  await expect(page).toHaveURL(/entry\/e-02/);
  await expect(
    page.locator('lw-content-area [role="tab"][data-reorder-id]'),
  ).toHaveCount(2);
}

async function tabOrder(page: Page): Promise<string[]> {
  return page
    .locator('lw-content-area [role="tab"][data-reorder-id]')
    .evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset['reorderId'] ?? ''),
    );
}

test.describe('User reorder', () => {
  test('keyboard reorders content tabs and the order persists (re-applied on re-open)', async ({
    page,
  }) => {
    await page.goto('/');
    await openTwoEntries(page);
    expect(await tabOrder(page)).toEqual(['entry/e-01', 'entry/e-02']);

    await page.locator('[data-reorder-id="entry/e-01"]').focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect
      .poll(() => tabOrder(page))
      .toEqual(['entry/e-02', 'entry/e-01']);

    await page.reload();
    await openTwoEntries(page);
    await expect
      .poll(() => tabOrder(page))
      .toEqual(['entry/e-02', 'entry/e-01']);
  });

  test('pointer drag reorders content tabs', async ({ page }) => {
    await page.goto('/');
    await openTwoEntries(page);
    expect(await tabOrder(page)).toEqual(['entry/e-01', 'entry/e-02']);

    const app = page.locator('[data-reorder-id="entry/e-02"]');
    const to = (await app.boundingBox())!;
    await dragTo(page, '[data-reorder-id="entry/e-01"]', {
      x: to.x + to.width,
      y: to.y + to.height / 2,
    });

    await expect
      .poll(() => tabOrder(page))
      .toEqual(['entry/e-02', 'entry/e-01']);
  });

  test('keyboard reorders rail items within the band and persists across reload', async ({
    page,
  }) => {
    await page.goto('/');
    const rail = page.getByRole('navigation', { name: 'Toolbar' });
    const railOrder = () =>
      rail
        .locator('[data-reorder-id]')
        .evaluateAll((els) =>
          els.map((el) => (el as HTMLElement).dataset['reorderId'] ?? ''),
        );
    const before = await railOrder();
    expect(before.length).toBeGreaterThan(1);

    await rail.locator(`[data-reorder-id="${before[0]}"]`).focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect
      .poll(railOrder)
      .toEqual([before[1], before[0], ...before.slice(2)]);

    await page.reload();
    await expect
      .poll(railOrder)
      .toEqual([before[1], before[0], ...before.slice(2)]);
  });
});
