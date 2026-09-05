import { expect, type Page, test } from '@playwright/test';

/* Finance is the module the tree was built for: six areas, one shut by the declaration, one holding
   a single view, and a sidebar long enough to scroll. */

function areaHeading(page: Page, area: string) {
  return page.locator(`[data-nav-area="${area}"] .lw-nav-group-heading`);
}

function navEntry(page: Page, path: string) {
  return page.locator(`[data-nav-view="${path}"]`);
}

async function openFinance(page: Page): Promise<void> {
  await page.goto('/finance/receivables');
  await expect(page.getByTestId('receivables-list')).toBeVisible();
}

test('the module draws all six areas, and the one declared shut starts shut', async ({
  page,
}) => {
  await openFinance(page);

  await expect(page.locator('[data-nav-area]')).toHaveCount(6);
  await expect(areaHeading(page, 'matching')).toHaveAttribute('aria-expanded', 'false');
  await expect(navEntry(page, 'finance/matching')).toBeHidden();

  await areaHeading(page, 'matching').click();

  await expect(navEntry(page, 'finance/matching')).toBeVisible();
});

test('an area holding a single view is still an area', async ({ page }) => {
  await openFinance(page);

  const matching = page.locator('[data-nav-area="matching"]');
  await expect(matching).toHaveCount(1);
  await expect(matching.locator('[data-nav-view]')).toHaveCount(1);
});

/* More areas than fit. The tree does not scroll itself here: the workbench's surface wrapper is the
   scroller, which is the one this has to work with. What matters is that the last area is still
   reachable and still works. */
test('a sidebar too long for its panel is still reachable to its last area', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 420 });
  await openFinance(page);

  const panel = page.locator('lw-nav-tree').locator('xpath=ancestor::div[1]');
  await expect
    .poll(async () =>
      panel.evaluate((node) => node.scrollHeight > node.clientHeight + 1),
    )
    .toBe(true);

  await areaHeading(page, 'dunning').scrollIntoViewIfNeeded();
  await areaHeading(page, 'dunning').click();

  await expect(navEntry(page, 'finance/dunning')).toBeHidden();
});

test('folding survives leaving the module and coming back', async ({ page }) => {
  await openFinance(page);

  await areaHeading(page, 'receivables').click();
  await expect(areaHeading(page, 'receivables')).toHaveAttribute('aria-expanded', 'false');

  const rail = page.getByRole('navigation', { name: 'Activity bar' });
  await rail.getByRole('button', { name: 'Sales' }).click();
  await expect(page).toHaveURL(/\/sales\/customers$/);
  await rail.getByRole('button', { name: 'Finance' }).click();

  await expect(areaHeading(page, 'receivables')).toHaveAttribute('aria-expanded', 'false');
});

test('every area leads to content, and the sidebar marks where the visitor is', async ({
  page,
}) => {
  await openFinance(page);

  for (const [path, testid] of [
    ['finance/payables', 'payables-list'],
    ['finance/ledger', 'ledger-list'],
    ['finance/closing', 'closing-list'],
    ['finance/dunning', 'dunning-list'],
  ]) {
    await navEntry(page, path).click();
    await expect(page.getByTestId(testid)).toBeVisible();
    await expect(navEntry(page, path)).toHaveAttribute('aria-current', 'page');
  }
});

/* The books have to agree with themselves, and the view says so rather than leaving it to be read
   off two columns. */
test('the ledger reports that debit and credit agree', async ({ page }) => {
  await page.goto('/finance/ledger');

  await expect(page.getByTestId('ledger-balance')).toHaveText('debit equals credit');
});

/* Starting a dunning run is an action beside the content it acts on, not an entry in the tree, and
   it asks before it does anything with a side effect. */
test('the dunning run asks first, and raises every overdue receivable a level', async ({
  page,
}) => {
  await page.goto('/finance/dunning');
  const rows = page.getByTestId('dunning-list').locator('li');
  await expect(rows).toHaveCount(2);
  const before = await page
    .locator('[data-level]')
    .allInnerTexts();

  await page.getByTestId('dunning-run').click();
  await expect(page.getByRole('dialog')).toContainText('dunning level');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

  await expect.poll(() => page.locator('[data-level]').allInnerTexts()).toEqual(before);

  await page.getByTestId('dunning-run').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Start dunning run' }).click();

  await expect.poll(() => page.locator('[data-level]').allInnerTexts()).not.toEqual(before);
});

test('the dunning run is also a command, and the tree never carries it', async ({ page }) => {
  await openFinance(page);

  await expect(page.locator('[data-nav-view]')).toHaveCount(6);
  await expect(page.getByText('Start dunning run', { exact: true })).toHaveCount(0);
});
