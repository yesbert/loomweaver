import { expect, test } from '@playwright/test';

test.describe('Opening beside the pane carrying the address', () => {
  test('a list in the main area browses its entries in one preview beside itself', async ({
    page,
  }) => {
    await page.goto('/browse');
    const list = page.locator('lw-content-area [data-testid="list-list"]');
    await expect(list).toBeVisible();

    for (const subject of ['Alpha', 'Bravo', 'Charlie']) {
      await list.getByRole('button', { name: subject }).click({
        button: 'right',
      });
      await page
        .getByRole('menuitem', { name: 'Open preview beside' })
        .click();
    }

    await expect(
      page.getByRole('separator', { name: 'Resize split' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /^E-0/ })).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-03' })).toHaveClass(
      /italic/,
    );
    await expect(
      page.locator('lw-content-area').getByRole('tab', { name: /^E-0/ }),
    ).toHaveCount(0);
    await expect(list).toBeVisible();
    await expect(page).toHaveURL(/\/browse$/);
  });
});
