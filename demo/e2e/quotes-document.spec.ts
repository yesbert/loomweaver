import { expect, type Page, test } from '@playwright/test';
import { switchAccount } from './account';
import { tab, tabLabels } from './tabs';

const rows = '[data-testid="quotes-list"] li';

function row(page: Page, number: string) {
  return page.locator(`li[data-quote="${number}"] button`);
}

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
  await expect.poll(() => tabLabels(page)).toEqual([LANDING_TAB, LIST_TAB]);
});

test('one click previews a quote into a single reused slot', async ({ page }) => {
  await page.goto(LIST);

  await row(page, 'Q-0007').click();
  await expect.poll(() => tabLabels(page)).toEqual([LANDING_TAB, LIST_TAB, 'Q-0007, Sent']);
  await expect(page).toHaveURL(/\/sales\/quotes\/q-0007$/);

  await backToList(page);
  await row(page, 'Q-0006').click();
  await expect.poll(() => tabLabels(page)).toEqual([LANDING_TAB, LIST_TAB, 'Q-0006, Sent']);
});

test("a quote's tab carries its status as a badge", async ({ page }) => {
  await page.goto(LIST);

  await row(page, 'Q-0005').click();

  const badge = tab(page, 'sales/quotes/q-0005').getByTestId('tab-badge');
  await expect(badge).toHaveText('Accepted');
  await expect(badge).toHaveClass(/lw-badge--success/);
  await expect(tab(page, 'sales/quotes/q-0005')).toHaveAttribute(
    'aria-label',
    'Q-0005, Accepted',
  );
});

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
    .poll(() => tabLabels(page))
    .toEqual([LANDING_TAB, LIST_TAB, 'Q-0007, Sent', 'Q-0006, Sent']);
});

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

test('a document with two tax rates shows one line per rate', async ({ page }) => {
  await page.goto(LIST);
  await row(page, 'Q-0006').click();

  const totals = page.getByTestId('quote-totals');
  await expect(totals).toContainText('VAT 19%');
  await expect(totals).toContainText('VAT 7%');
});

test("a deep link opens the quote beside the module's landing tab rather than the list, labelled with its number and status", async ({ page }) => {
  await page.goto('/sales/quotes/q-0004');

  await expect.poll(() => tabLabels(page)).toEqual([LANDING_TAB, 'Q-0004, Draft']);
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

test('a right-click on a row opens a menu whose "Open" keeps the quote', async ({ page }) => {
  await page.goto(LIST);

  await row(page, 'Q-0005').click({ button: 'right' });
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveText([
    'Open',
    'Open as preview',
    'New quote for this customer',
  ]);

  await menu.getByRole('menuitem', { name: 'Open', exact: true }).click();

  await expect(page).toHaveURL(/\/sales\/quotes\/q-0005$/);
  await expect(tab(page, 'sales/quotes/q-0005')).toHaveCSS('font-style', 'normal');
});

test('the menu speaks the language of the page', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lw.shell.lang', 'de'));
  await page.goto(LIST);

  await row(page, 'Q-0005').click({ button: 'right' });

  await expect(page.getByRole('menu').getByRole('menuitem')).toHaveText([
    'Öffnen',
    'In Vorschau öffnen',
    'Neues Angebot für diesen Kunden',
  ]);
});

async function setMarginShown(page: Page, shown: boolean): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Left activity bar' })
    .getByRole('button', { name: 'Settings' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Quotes', exact: true }).click();
  const toggle = dialog.getByRole('switch', { name: 'Show margin analysis' });
  if ((await toggle.isChecked()) !== shown) {
    await toggle.click();
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
}

test('the margin can be left out: no tab, no padlock, and the customer takes the room', async ({
  page,
}) => {
  await page.goto('/sales/quotes/q-0007');
  const panes = page.locator('lw-container-pane-host lw-pane-view');
  await expect(panes).toHaveCount(3);

  await setMarginShown(page, false);
  await expect(panes).toHaveCount(2);
  await expect(page.getByTestId('quote-margin')).toHaveCount(0);

  await switchAccount(page);
  await expect(page.getByTestId('access-placeholder')).toHaveCount(0);
  await expect(panes).toHaveCount(2);
  await switchAccount(page);

  await setMarginShown(page, true);
  await expect(panes).toHaveCount(3);
  await expect(page.getByTestId('quote-margin')).toBeVisible();
});

test('the margin is visible to accounting and locked for everyone else', async ({ page }) => {
  await page.goto('/sales/quotes/q-0007');

  await expect(page.getByTestId('quote-margin')).toBeVisible();
  await expect(page.getByTestId('quote-margin-total')).toContainText('%');

  await switchAccount(page);

  await expect(page.getByTestId('quote-margin')).toHaveCount(0);
  await expect(page.getByTestId('access-placeholder')).toContainText('No access');
  await expect(page.getByTestId('quote-positions')).toBeVisible();

  await switchAccount(page);
  await expect(page.getByTestId('quote-margin')).toBeVisible();
});
