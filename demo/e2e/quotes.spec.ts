import { expect, test } from '@playwright/test';

const rows = '[data-testid="quotes-list"] li';

/* The list is a view of the Sales module: it has an address of its own, and going to it enters the
   module the address belongs to. A quote's address shows the document instead, so these tests enter
   at the list. */
test.beforeEach(async ({ page }) => {
  await page.goto('/sales/quotes');
  await expect(page.locator(rows).first()).toBeVisible();
});

test('lists the sample quotes newest first', async ({ page }) => {
  await expect(page.locator(rows)).toHaveCount(7);
  await expect(page.locator(rows).first()).toContainText('Q-');
  await expect(page.locator(rows).first()).toContainText('Nordwind Logistik GmbH');
});

/* The foot has to agree with the rows above it, so it counts and sums what the filter left. */
test('filters by status and sums what is shown', async ({ page }) => {
  const footer = page.getByTestId('quotes-footer');
  await expect(footer).toContainText('7 of 7');
  const unfiltered = await footer.innerText();

  await page.getByRole('button', { name: 'Status' }).click();
  await page.getByRole('option', { name: 'Accepted' }).click();

  await expect(page.locator(rows)).toHaveCount(2);
  await expect(page.locator(rows).first()).toContainText('Accepted');
  await expect(footer).toContainText('2 of 7');
  expect(await footer.innerText()).not.toBe(unfiltered);
});

test('searches by customer and reports when nothing matches', async ({ page }) => {
  const search = page.getByRole('searchbox');

  await search.fill('kranich');
  await expect(page.locator(rows)).toHaveCount(1);
  await expect(page.locator(rows).first()).toContainText('Kranich Medien GmbH');

  await search.fill('nothing here');
  await expect(page.locator(rows)).toHaveCount(1);
  await expect(page.locator(rows).first()).toContainText('No quote matches');
});

/* Amounts and dates are formatted from the active language, not baked into the data. Switching
   language has to move both, or the demo is only half translated. */
test('formats money and dates in the active language', async ({ page }) => {
  const first = page.locator(rows).first();
  await expect(first).toContainText('€');

  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Deutsch' }).click();

  await expect(page.locator(rows).first()).toContainText('Versendet');
  await expect(page.locator(rows).first()).toContainText(/\d{2}\.\d{2}\.\d{4}/);
});
