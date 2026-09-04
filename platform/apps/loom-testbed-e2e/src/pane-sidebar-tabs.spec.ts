import { expect, test } from '@playwright/test';
import { dragTo } from './support/helpers';

test.describe('Sidebar ⇄ center tab moves', () => {
  test('a view tab dropped on the URL strip joins it as a titled tab — no split, URL stays (R3a/R9)', async ({
    page,
  }) => {
    await page.goto('/');

    await page.goto('/dashboard/overview');
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    const strip = (await page
      .locator('lw-content-area [role="tablist"]')
      .boundingBox())!;

    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      {
        x: strip.x + strip.width - 40,
        y: strip.y + strip.height / 2,
      },
    );

    await expect(
      page.locator('lw-content-area [role="tab"][aria-label="Outline"]'),
    ).toBeVisible();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);

    await expect(
      page.locator('#panel-views-left-panel [role="tab"][aria-label="Outline"]'),
    ).toHaveCount(0);

    await expect(
      page.locator('lw-content-area lw-testbed-outline-view'),
    ).toBeVisible();
    await expect(page).toHaveURL(/dashboard\/overview/);

    await page.reload();
    await expect(
      page.locator('lw-content-area [role="tab"][aria-label="Outline"]'),
    ).toBeVisible();
    await expect(page.locator('#lw-main-content')).toBeVisible();

    await page
      .locator('lw-content-area [role="tab"][aria-label="Outline"]')
      .click();
    await expect(
      page.locator('lw-content-area lw-testbed-outline-view'),
    ).toBeVisible();
    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.locator('#lw-main-content')).toBeVisible();
  });

  test('a content tab dropped on a sidebar strip becomes an icon tab and renders host-side (R6/R7/E7)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).first().dblclick();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();

    const strip = (await page
      .locator('#panel-views-left-panel [role="tablist"]')
      .boundingBox())!;
    await dragTo(page, 'lw-content-area [role="tab"][aria-label="E-01"]', {
      x: strip.x + strip.width - 24,
      y: strip.y + strip.height / 2,
    });

    await expect(
      page.locator('#panel-views-left-panel [role="tab"][aria-label="E-01"]'),
    ).toBeVisible();

    await expect(
      page.locator('lw-content-area [role="tab"][aria-label="E-01"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('lw-shell-panel lw-testbed-entry-view'),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/entry\/e-01/);

    await page.reload();
    await expect(
      page.locator('#panel-views-left-panel [role="tab"][aria-label="E-01"]'),
    ).toBeVisible();
  });
});
