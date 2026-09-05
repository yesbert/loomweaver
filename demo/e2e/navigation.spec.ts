import { expect, type Page, test } from '@playwright/test';

/* The sidebar's own strip names the view docked in it, so the name the workbench draws there is the
   one the navigation tree asked for. It renames the surface rather than registering it again, which
   is why the tree keeps what the visitor folded. */
function sidebarName(page: Page) {
  return page
    .locator('[id="pane-strip:left-panel:main"] [role="tab"]')
    .first();
}

function navEntry(page: Page, path: string) {
  return page.locator(`[data-nav-view="${path}"]`);
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

function areaHeading(page: Page, area: string) {
  return page.locator(`[data-nav-area="${area}"] .lw-nav-group-heading`);
}

/* Renaming does not rebuild the surface, and the tree keeps the fold beside itself rather than on
   the instance, so a fold the visitor made survives the rename that following them into another
   area performs. */
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
