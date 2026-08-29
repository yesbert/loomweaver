import { Page, expect, test } from '@playwright/test';

async function expectPadding(
  page: Page,
  selector: string,
  expected: string,
): Promise<void> {
  await expect
    .poll(() =>
      page
        .locator(selector)
        .first()
        .evaluate((element) => getComputedStyle(element).padding),
    )
    .toBe(expected);
}

test.describe('A surface can own its pane edges (padded: false)', () => {
  test('the host stops insetting it — in the URL pane and in a split alike', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'Entry list' })).toBeVisible();
    await expectPadding(page, '#lw-main-content', '24px');

    await page
      .locator('lw-content-area lw-pane-toolbar button[aria-label="New tab"]')
      .click();
    await page
      .locator('lw-menu [role^="menuitem"]')
      .filter({ hasText: 'Search' })
      .first()
      .click();
    await expect(page).toHaveURL(/\/search/);
    await expectPadding(page, '#lw-main-content', '0px');

    await page
      .locator('lw-content-area lw-pane-toolbar button[aria-label="Split right"]')
      .click();
    await expect(page.locator('lw-content-grid lw-pane-view')).toHaveCount(1);
    await expectPadding(
      page,
      'lw-content-grid lw-pane-view lw-content-secondary-pane',
      '0px',
    );
  });
});
