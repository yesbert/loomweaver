import { expect, test } from '@playwright/test';

test.describe('Cross-panel view move', () => {
  const left = '#panel-views-primary';
  const right = '#panel-views-secondary';

  test('moves a view to the other sidebar and the placement persists', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();

    await page.locator(left).getByRole('tab', { name: 'Outline' }).focus();
    await page.keyboard.press('Alt+Shift+ArrowRight');

    await expect(
      page.locator(right).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.locator(right).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);

    await page.locator(right).getByRole('tab', { name: 'Outline' }).focus();
    await page.keyboard.press('Alt+Shift+ArrowLeft');
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    await expect(
      page.locator(right).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);
  });

  test('the view-tab context menu moves a view to the other sidebar', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();

    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Move to other sidebar' }).click();

    await expect(
      page.locator(right).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);
  });
});
