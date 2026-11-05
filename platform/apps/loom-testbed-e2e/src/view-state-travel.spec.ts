import { expect, test } from '@playwright/test';
import { dragTo } from './support/helpers';

test.describe('View state travels with a moved view tab', () => {
  test('the outline keeps its saved sort when dragged from the sidebar into a content pane and back', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    await page
      .locator('#panel-views-left-panel')
      .getByRole('tab', { name: 'Outline' })
      .click();

    const sortButton = page.getByTestId('outline-sort');
    await sortButton.click();
    await expect(sortButton).toHaveText(/A–Z/);
    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('lw.shell.view-state:testbed.outline'),
        ),
      )
      .toContain('alpha');

    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      {
        x: content.x + content.width - 12,
        y: content.y + content.height / 2,
      },
    );

    const pane = page.locator('lw-surface-body lw-testbed-outline-view');
    await expect(pane).toBeVisible();
    await expect(pane.getByTestId('outline-sort')).toHaveText(/A–Z/);
    await expect(pane.locator('ol li').first()).toContainText('Row A');

    await page.reload();
    await expect(pane.getByTestId('outline-sort')).toHaveText(/A–Z/);

    const strip = (await page
      .locator('#panel-views-left-panel [role="tablist"]')
      .boundingBox())!;
    await dragTo(
      page,
      'lw-pane-view:not([data-address-pane]) [role="tab"][aria-label="Outline"]',
      { x: strip.x + strip.width - 24, y: strip.y + strip.height / 2 },
    );

    const docked = page.locator('lw-shell-panel lw-testbed-outline-view');
    await expect(docked).toBeVisible();
    await expect(pane).toHaveCount(0);
    await expect(docked.getByTestId('outline-sort')).toHaveText(/A–Z/);
    await expect(docked.locator('ol li').first()).toContainText('Row A');
  });
});
