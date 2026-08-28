import { expect, test } from '@playwright/test';
import { dragTo, openEntry } from './support/helpers';

test.describe('Tab move semantics', () => {
  test('tab menu "Split right" MOVES a router-bound doc tab into a new group that takes the URL (R2/R4/E3)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Split right' }).click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);

    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(
      page
        .locator(
          'lw-content-area lw-testbed-entry-view, lw-content-area textarea',
        )
        .first(),
    ).toBeVisible();

    await expect(
      page.locator('lw-pane-view lw-pane-tab-strip [role="tab"]'),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'lw-pane-view lw-pane-tab-strip [role="tab"][aria-label="E-02"]',
      ),
    ).toHaveCount(1);

    await expect(
      page.locator('lw-pane-view lw-testbed-entry-view'),
    ).toBeVisible();
    await expect(
      page.locator('lw-pane-view lw-testbed-entry-view'),
    ).toContainText('E-02');

    await page.locator('lw-pane-view lw-testbed-entry-view').click();
    await expect(page).toHaveURL(/entry\/e-02/);

    await page.reload();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);
  });

  test('tab menu "Split down" MOVES the tab into a new group stacked below (R4)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Split down' }).click();

    await expect(
      page.locator(
        'lw-content-grid lw-pane-split-handle[aria-orientation="horizontal"]',
      ),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);
    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(
      page.locator(
        'lw-pane-view lw-pane-tab-strip [role="tab"][aria-label="E-02"]',
      ),
    ).toHaveCount(1);
  });

  test('dragging a router-bound doc tab onto a content edge splits WITH the tab; the source loses it (R2/R3b/R6)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');
    await expect(page).toHaveURL(/entry\/e-02/);

    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(page, '[role="tab"][aria-label="E-01"]', {
      x: content.x + content.width - 12,
      y: content.y + content.height / 2,
    });

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);
    await expect(page).toHaveURL(/entry\/e-01/);
  });

  test('dropping a pane tab onto the URL strip moves it into the URL group; the emptied pane collapses (R3a/R5)', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-pane-view [role="tab"]')).toHaveCount(1);

    await page.goto('/dashboard/overview');
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

    const strip = (await page
      .locator('lw-content-area [role="tablist"]')
      .boundingBox())!;
    await dragTo(page, 'lw-pane-view [role="tab"]', {
      x: strip.x + strip.width - 40,
      y: strip.y + strip.height / 2,
    });

    await expect(page.locator('lw-pane-view')).toHaveCount(0);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/search$/);
  });
});
