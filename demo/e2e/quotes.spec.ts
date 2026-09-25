import { expect, test } from '@playwright/test';

const rows = '[data-testid="quotes-list"] li';

test.beforeEach(async ({ page }) => {
  await page.goto('/sales/quotes');
  await expect(page.locator(rows).first()).toBeVisible();
});

test('lists the sample quotes newest first', async ({ page }) => {
  await expect(page.locator(rows)).toHaveCount(7);
  await expect(page.locator(rows).first()).toContainText('Q-');
  await expect(page.locator(rows).first()).toContainText('Nordwind Logistik GmbH');
});

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

test('formats money and dates in the active language', async ({ page }) => {
  const first = page.locator(rows).first();
  await expect(first).toContainText('€');

  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Deutsch' }).click();

  await expect(page.locator(rows).first()).toContainText('Versendet');
  await expect(page.locator(rows).first()).toContainText(/\d{2}\.\d{2}\.\d{4}/);
});

test('a new quote asks for the customer and opens once created', async ({ page }) => {
  await page.getByTestId('quote-create').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Which customer is it for?');
  await dialog.getByRole('textbox').fill('Nordwind');
  await dialog.getByRole('button', { name: 'Create' }).click();

  await expect(page).toHaveURL(/\/sales\/quotes\/q-\d+-new$/);
  await expect(page.getByRole('status')).toContainText('Quote created.');
});
