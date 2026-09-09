import { expect, type Page, test } from '@playwright/test';

/* The + on a tab strip offers the routes this product hosts at a bare path. The demo's navigation
   is a tree under modules, so the dashboard is the only one, and it is registered twice on purpose:
   the landing route is chromeless, and a chromeless route is not something a pane can host. */

function picker(page: Page) {
  return page.getByRole('menu');
}

function navTree(page: Page) {
  return page.getByTestId('module-nav');
}

test('the New tab button offers the dashboard, and picking it opens it in that pane', async ({
  page,
}) => {
  await page.goto('/sales/customers');

  await page.getByTestId('pane-add-tab').click();
  await expect(picker(page).getByRole('menuitem')).toHaveCount(1);

  await picker(page).getByRole('menuitem', { name: 'Overview' }).click();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
});

/* A tab that belongs to no module must not empty the module's tree: the visitor is still in Sales,
   and a blank panel would say otherwise. Nothing in it is current, because nothing in it is open. */
test('opening it leaves the module tree standing, with nothing marked current', async ({ page }) => {
  await page.goto('/sales/customers');
  await expect(navTree(page).locator('[data-nav-view]')).toHaveCount(3);

  await page.getByTestId('pane-add-tab').click();
  await picker(page).getByRole('menuitem', { name: 'Overview' }).click();
  await expect(page).toHaveURL(/\/overview$/);

  await expect(navTree(page).locator('[data-nav-view]')).toHaveCount(3);
  await expect(navTree(page).locator('[aria-current="page"]')).toHaveCount(0);
});
