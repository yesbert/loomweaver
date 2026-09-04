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

    const pane = page.locator(
      'lw-content-secondary-pane lw-testbed-outline-view',
    );
    await expect(pane).toBeVisible();
    await expect(pane.getByTestId('outline-sort')).toHaveText(/A–Z/);
    await expect(pane.locator('ol li').first()).toContainText('Row A');

    await page.reload();
    await expect(
      page
        .locator('lw-content-secondary-pane lw-testbed-outline-view')
        .getByTestId('outline-sort'),
    ).toHaveText(/A–Z/);
  });
});
