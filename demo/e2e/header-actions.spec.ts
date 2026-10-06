import { expect, test } from '@playwright/test';

const ACTIONS = [
  ['/sales/customers', 'New customer'],
  ['/people/payroll', 'Run payroll'],
  ['/finance/dunning', 'Start dunning run'],
  ['/inventory/stock', 'Post stock count'],
  ['/procurement/orders', 'Post goods receipt'],
] as const;

for (const [path, title] of ACTIONS) {
  test(`${path} offers "${title}" in its header, as the command the palette runs`, async ({
    page,
  }) => {
    await page.goto(path);

    const action = page.getByTestId('surface-actions').getByRole('button', { name: title });
    await expect(action).toBeVisible();
  });
}

test('the header action runs the command, which asks before posting goods', async ({ page }) => {
  await page.goto('/procurement/orders');
  const open = await page.getByTestId('orders-open').innerText();

  await page
    .getByTestId('surface-actions')
    .getByRole('button', { name: 'Post goods receipt' })
    .click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('orders-open')).toHaveText(open);
});
