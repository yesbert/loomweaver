import { expect, type Page, test } from '@playwright/test';

/* The quote list is a view of the Sales module and each quote opens as a content tab beside it.
   One click previews into a single reused slot; the shell's own gesture on the tab keeps it. */

const rows = '[data-testid="quotes-list"] li';

/* Scoped to the URL pane's own strip: the rail draws icon tabs with the same role, and the
   document is a container whose children draw strips of their own inside the content area. Read as
   rendered text, because each tab carries its tooltip in the same element and a textContent
   assertion sees every label twice. */
function tabs(page: Page) {
  return page
    .locator('[id="pane-strip:content:main"] [role="tab"]')
    .allInnerTexts();
}

function tab(page: Page, path: string) {
  return page.locator(
    `[id="pane-strip:content:main"] [role="tab"][data-tab-path="${path}"]`,
  );
}

function row(page: Page, number: string) {
  return page.locator(`li[data-quote="${number}"] button`);
}

/* The Sales module opens its customer list as a tab it never closes, so every tab assertion below
   counts from it. The list itself is the second one, and opening a quote from it hands the pane to
   the document — coming back to a row means going back through the list's tab. */
const LANDING_TAB = 'Customer list';
const LIST_TAB = 'Quotes';
const LIST = '/sales/quotes';

async function backToList(page: Page): Promise<void> {
  await tab(page, 'sales/quotes').click();
  await expect(page.locator(rows).first()).toBeVisible();
}

test('the list is a view of the module, opened beside the tab the module lands on', async ({
  page,
}) => {
  await page.goto(LIST);

  await expect(page.locator(rows)).toHaveCount(7);
  await expect.poll(() => tabs(page)).toEqual([LANDING_TAB, LIST_TAB]);
});

test('one click previews a quote into a single reused slot', async ({ page }) => {
  await page.goto(LIST);

  await row(page, 'Q-0007').click();
  await expect.poll(() => tabs(page)).toEqual([LANDING_TAB, LIST_TAB, 'Q-0007']);
  await expect(page).toHaveURL(/\/sales\/quotes\/q-0007$/);

  await backToList(page);
  await row(page, 'Q-0006').click();
  await expect.poll(() => tabs(page)).toEqual([LANDING_TAB, LIST_TAB, 'Q-0006']);
});

/* Keeping a preview is the shell's gesture on the tab, not the list's on the row: the first click
   on a row hands the pane to the document, so a second one never reaches the list again. */
test('a preview kept from the strip survives the next one', async ({ page }) => {
  await page.goto(LIST);

  await row(page, 'Q-0007').click();
  const kept = tab(page, 'sales/quotes/q-0007');
  await expect(kept).toHaveCSS('font-style', 'italic');

  await kept.dblclick();
  await expect(kept).toHaveCSS('font-style', 'normal');

  await backToList(page);
  await row(page, 'Q-0006').click();
  await expect
    .poll(() => tabs(page))
    .toEqual([LANDING_TAB, LIST_TAB, 'Q-0007', 'Q-0006']);
});

/* The document and the list row compute their money from the same library, so the two figures
   have to agree. If they ever disagree, one of them is doing its own arithmetic. */
test('the document total matches the figure the list shows for the same quote', async ({
  page,
}) => {
  await page.goto(LIST);

  const listRow = page.locator('li[data-quote="Q-0007"]');
  const listTotal = (await listRow.innerText()).match(/€[\d.,]+/)?.[0];

  await listRow.locator('button').click();

  await expect(page.getByTestId('quote-customer')).toContainText('Nordwind Logistik GmbH');
  await expect(page.getByTestId('quote-lines').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('quote-gross')).toHaveText(listTotal!);
});

/* Printed matter is taxed at 7% while services are at 19%, so this document carries two buckets —
   the case a single-rate demo never exercises. */
test('a document with two tax rates shows one line per rate', async ({ page }) => {
  await page.goto(LIST);
  await row(page, 'Q-0006').click();

  const totals = page.getByTestId('quote-totals');
  await expect(totals).toContainText('VAT 19%');
  await expect(totals).toContainText('VAT 7%');
});

/* A deep link opens the tab before anything has read the document, so the host labels it from the
   surface title. The view refines it; without that the tab reads "Quote". The list is not part of
   it: a link into a document opens the module, not the view the document happens to sit under. */
test('a deep link labels its tab with the document number', async ({ page }) => {
  await page.goto('/sales/quotes/q-0004');

  await expect.poll(() => tabs(page)).toEqual([LANDING_TAB, 'Q-0004']);
});

test('a link to a quote that does not exist says so', async ({ page }) => {
  await page.goto('/sales/quotes/nope');

  await expect(page.getByTestId('quote-missing')).toBeVisible();
});

test('the document reads in German', async ({ page }) => {
  await page.goto('/sales/quotes/q-0007');
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Deutsch' }).click();

  await expect(page.getByTestId('quote-customer')).toContainText('Versendet');
  await expect(page.getByTestId('quote-positions')).toContainText('Beratung');
  await expect(page.getByTestId('quote-gross')).toHaveText('18.264,12 €');
});

test('the document opens as an arrangement: positions beside customer and margin', async ({
  page,
}) => {
  await page.goto('/sales/quotes/q-0007');

  const host = page.locator('lw-container-pane-host');
  await expect(host.locator('lw-pane-view')).toHaveCount(3);

  const positions = await host.locator('lw-pane-view').first().boundingBox();
  const customer = await host.locator('lw-pane-view').nth(1).boundingBox();
  expect(positions!.width).toBeGreaterThan(customer!.width);
  expect(customer!.height).toBeLessThan(positions!.height);
});

test('the margin is visible to accounting and locked for everyone else', async ({ page }) => {
  await page.goto('/sales/quotes/q-0007');

  await expect(page.getByTestId('quote-margin')).toBeVisible();
  await expect(page.getByTestId('quote-margin-total')).toContainText('%');

  await page.getByRole('button', { name: 'Switch account' }).click();

  await expect(page.getByTestId('quote-margin')).toHaveCount(0);
  await expect(page.getByTestId('access-placeholder')).toContainText('No access');
  await expect(page.getByTestId('quote-positions')).toBeVisible();

  await page.getByRole('button', { name: 'Switch account' }).click();
  await expect(page.getByTestId('quote-margin')).toBeVisible();
});
