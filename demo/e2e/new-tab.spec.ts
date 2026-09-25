import { expect, type Page, test } from '@playwright/test';

function picker(page: Page) {
  return page.getByRole('menu');
}

function navTree(page: Page) {
  return page.getByTestId('module-nav');
}

test('the New tab button offers the dashboard as a tab of its own, since its chromeless landing cannot sit in a pane', async ({
  page,
}) => {
  await page.goto('/sales/customers');

  await page.getByTestId('pane-add-tab').click();
  await expect(picker(page).getByRole('menuitem')).toHaveCount(1);

  await picker(page).getByRole('menuitem', { name: 'Overview' }).click();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
});

test('opening it leaves the module tree standing, with nothing marked current', async ({ page }) => {
  await page.goto('/sales/customers');
  await expect(navTree(page).locator('[data-nav-view]')).toHaveCount(3);

  await page.getByTestId('pane-add-tab').click();
  await picker(page).getByRole('menuitem', { name: 'Overview' }).click();
  await expect(page).toHaveURL(/\/overview$/);

  await expect(navTree(page).locator('[data-nav-view]')).toHaveCount(3);
  await expect(navTree(page).locator('[aria-current="page"]')).toHaveCount(0);
});
