import { expect, type Page, test } from '@playwright/test';

/* The list is a sidebar surface and each quote opens as a content tab. One click previews into a
   single reused slot; two keep the tab. */

const rows = '[data-testid="quotes-list"] li';

/* Scoped to the URL pane's own strip: the sidebar draws icon tabs with the same role, and the
   document is a container whose children draw strips of their own inside the content area. Read as
   rendered text, because each tab carries its tooltip in the same element and a textContent
   assertion sees every label twice. */
function tabs(page: Page) {
  return page
    .locator('[id="pane-strip:content:main"] [role="tab"]')
    .allInnerTexts();
}

function row(page: Page, number: string) {
  return page.locator(`li[data-quote="${number}"] button`);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('lw.shell.active-workspace', 'default'),
  );
});

test('the list lives in the sidebar and an empty workspace opens nothing', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator(rows)).toHaveCount(7);
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
  await expect.poll(() => tabs(page)).toEqual([]);
});

test('one click previews a quote into a single reused slot', async ({ page }) => {
  await page.goto('/');

  await row(page, 'Q-0007').click();
  await expect.poll(() => tabs(page)).toEqual(['Q-0007']);
  await expect(page).toHaveURL(/\/quotes\/q-0007$/);

  await row(page, 'Q-0006').click();
  await expect.poll(() => tabs(page)).toEqual(['Q-0006']);
});

/* Re-opening a tab never promotes it, whatever flag is passed — the host preserves its preview
   state — so keeping one is a second call. Without it, browsing would replace the kept tab. */
test('two clicks keep the quote, and the next preview lands beside it', async ({ page }) => {
  await page.goto('/');

  await row(page, 'Q-0007').dblclick();
  await expect.poll(() => tabs(page)).toEqual(['Q-0007']);

  await row(page, 'Q-0006').click();
  await expect.poll(() => tabs(page)).toEqual(['Q-0007', 'Q-0006']);
});

/* With previews reusing one slot, the row marking is the only thing that says which document is
   on screen. It reads the host's active content rather than tracking clicks itself. */
test('the list marks the quote the content area is showing', async ({ page }) => {
  await page.goto('/');

  await row(page, 'Q-0007').click();
  await expect(page.locator('[aria-current="true"]')).toHaveAttribute(
    'aria-label',
    /Q-0007/,
  );

  await row(page, 'Q-0003').click();
  await expect(page.locator('[aria-current="true"]')).toHaveAttribute(
    'aria-label',
    /Q-0003/,
  );
});

/* The document and the list row compute their money from the same library, so the two figures
   have to agree. If they ever disagree, one of them is doing its own arithmetic. */
test('the document total matches the figure the list shows for the same quote', async ({
  page,
}) => {
  await page.goto('/');

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
  await page.goto('/');
  await row(page, 'Q-0006').click();

  const totals = page.getByTestId('quote-totals');
  await expect(totals).toContainText('VAT 19%');
  await expect(totals).toContainText('VAT 7%');
});

/* A deep link opens the tab before anything has read the document, so the host labels it from the
   surface title. The view refines it; without that the tab reads "Quote". */
test('a deep link labels its tab with the document number', async ({ page }) => {
  await page.goto('/quotes/q-0004');

  await expect.poll(() => tabs(page)).toEqual(['Q-0004']);
});

test('a link to a quote that does not exist says so', async ({ page }) => {
  await page.goto('/quotes/nope');

  await expect(page.getByTestId('quote-missing')).toBeVisible();
});

test('the document reads in German', async ({ page }) => {
  await page.goto('/quotes/q-0007');
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Deutsch' }).click();

  await expect(page.getByTestId('quote-customer')).toContainText('Versendet');
  await expect(page.getByTestId('quote-positions')).toContainText('Beratung');
  await expect(page.getByTestId('quote-gross')).toHaveText('18.264,12 €');
});

test('the document opens as an arrangement: positions beside customer and margin', async ({
  page,
}) => {
  await page.goto('/quotes/q-0007');

  const host = page.locator('lw-container-pane-host');
  await expect(host.locator('lw-pane-view')).toHaveCount(3);

  const positions = await host.locator('lw-pane-view').first().boundingBox();
  const customer = await host.locator('lw-pane-view').nth(1).boundingBox();
  expect(positions!.width).toBeGreaterThan(customer!.width);
  expect(customer!.height).toBeLessThan(positions!.height);
});

test('the margin is visible to accounting and locked for everyone else', async ({ page }) => {
  await page.goto('/quotes/q-0007');

  await expect(page.getByTestId('quote-margin')).toBeVisible();
  await expect(page.getByTestId('quote-margin-total')).toContainText('%');

  await page.getByRole('button', { name: 'Switch account' }).click();

  await expect(page.getByTestId('quote-margin')).toHaveCount(0);
  await expect(page.getByTestId('access-placeholder')).toContainText('No access');
  await expect(page.getByTestId('quote-positions')).toBeVisible();

  await page.getByRole('button', { name: 'Switch account' }).click();
  await expect(page.getByTestId('quote-margin')).toBeVisible();
});
