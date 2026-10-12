import { expect, test } from '@playwright/test';

test.describe('A revealed view comes to the front on a narrow window', () => {
  test.use({ viewport: { width: 700, height: 850 } });

  test('in a fresh session, before its panel was ever opened', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Alpha' })).toBeHidden();

    await page.getByRole('button', { name: 'Open the entry list' }).click();

    await expect(page.getByRole('button', { name: 'Alpha' })).toBeVisible();
  });

  test('after its panel was opened and closed again', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open panel' }).first().click();
    await page.getByRole('button', { name: 'Close panel' }).first().click();
    await expect(page.getByRole('button', { name: 'Alpha' })).toBeHidden();

    await page.getByRole('button', { name: 'Open the entry list' }).click();

    await expect(page.getByRole('button', { name: 'Alpha' })).toBeVisible();
  });
});
