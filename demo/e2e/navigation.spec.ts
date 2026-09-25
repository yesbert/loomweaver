import { expect, type Page, test } from '@playwright/test';
import { areaHeading, navEntry } from './nav-tree';

function sidebarName(page: Page) {
  return page
    .locator('[id="pane-strip:left-panel:main"] [role="tab"]')
    .first();
}

test('the sidebar names the area the visitor is in, and follows them into the next one', async ({
  page,
}) => {
  await page.goto('/sales/customers');

  await expect(sidebarName(page)).toHaveAttribute('aria-label', 'Customers');

  await navEntry(page, 'sales/quotes').click();

  await expect(sidebarName(page)).toHaveAttribute('aria-label', 'Order handling');
});

test('a deep link marks the view it sits under, and names that view its area', async ({
  page,
}) => {
  await page.goto('/sales/quotes/q-0006');

  await expect(navEntry(page, 'sales/quotes')).toHaveAttribute('aria-current', 'page');
  await expect(navEntry(page, 'sales/customers')).not.toHaveAttribute('aria-current', 'page');
  await expect(sidebarName(page)).toHaveAttribute('aria-label', 'Order handling');
});

test('folding survives the visitor moving between areas', async ({ page }) => {
  await page.goto('/sales/customers');

  await areaHeading(page, 'customers').click();
  await expect(navEntry(page, 'sales/contacts')).toBeHidden();

  await navEntry(page, 'sales/quotes').click();
  await expect(sidebarName(page)).toHaveAttribute('aria-label', 'Order handling');

  await expect(areaHeading(page, 'customers')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('the first click after returning to a workspace takes', async ({ page }) => {
  const rail = page.getByRole('navigation', { name: 'Left activity bar' });
  await page.goto('/');

  await rail.getByRole('button', { name: 'People' }).click();
  await navEntry(page, 'people/payroll').click();
  await expect(page).toHaveURL(/\/people\/payroll$/);

  await rail.getByRole('button', { name: 'Inventory' }).click();
  await expect(page).toHaveURL(/\/inventory\//);

  await rail.getByRole('button', { name: 'People' }).click();
  await expect(page).toHaveURL(/\/people\/payroll$/);
  await navEntry(page, 'people/employees').click();

  await expect(page).toHaveURL(/\/people\/employees$/);
  await expect(navEntry(page, 'people/employees')).toHaveAttribute('aria-current', 'page');
});
