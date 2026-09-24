import { expect, test } from '@playwright/test';
import { dragTo } from './support/helpers';

const addressPane = 'lw-address-pane-header';
const otherPane = 'lw-pane-view:not([data-address-pane])';

test.describe('The one preview in the main area', () => {
  test('stays a preview where it was dragged, and the next preview lands in it', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Charlie' }).dblclick();
    await expect(page.getByRole('tab', { name: 'E-03' })).not.toHaveClass(
      /italic/,
    );
    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page).toHaveURL(/\/entry\/e-01$/);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveClass(/italic/);

    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(page, `${addressPane} [role="tab"][aria-label="E-01"]`, {
      x: content.x + content.width - 12,
      y: content.y + content.height / 2,
    });
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(
      page.locator(addressPane).getByRole('tab', { name: 'E-01' }),
    ).toHaveClass(/italic/);
    await expect(page).toHaveURL(/\/entry\/e-01$/);

    await page.locator(otherPane).getByRole('tab', { name: 'E-03' }).click();
    await expect(page).toHaveURL(/\/entry\/e-03$/);

    await page.getByRole('button', { name: 'Bravo' }).click();

    await expect(page).toHaveURL(/\/entry\/e-02$/);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);
    await expect(
      page.locator(addressPane).getByRole('tab', { name: 'E-02' }),
    ).toHaveClass(/italic/);
    await expect(
      page.locator(otherPane).getByRole('tab', { name: 'E-03' }),
    ).toBeVisible();
    await expect(
      page.locator(otherPane).getByRole('tab', { name: 'E-02' }),
    ).toHaveCount(0);
    await expect(page.locator('[data-entry="e-01"][data-open]')).toHaveCount(0);
  });
});
