import { expect, type Page, test } from '@playwright/test';

/* The note on a quote's customer panel is the demo's one editable field, and it is there to show
   the shell's own question: a container child reports itself dirty, and closing the document asks
   before anything is lost. The save keeps the note for as long as the session lasts, which is all
   a demo without a backend can honestly do — so every reopening below goes through the list rather
   than through the address bar, because a reload is where that session ends. */

const NOTE = 'Call back before the quote expires.';

function note(page: Page) {
  return page.getByTestId('quote-note');
}

function tab(page: Page, path: string) {
  return page.locator(
    `[id="pane-strip:content:main"] [role="tab"][data-tab-path="${path}"]`,
  );
}

function dialog(page: Page) {
  return page.getByRole('dialog');
}

async function openQuote(page: Page): Promise<void> {
  await page.locator('[data-nav-view="sales/quotes"]').click();
  await page.locator('li[data-quote="Q-0007"] button').click();
  await expect(note(page)).toBeVisible();
}

/* The close control is a sibling of the tab button, not a child of it, so it is reached through
   the wrapper the two share. On a tab holding unsaved work it shares its place with the mark and
   appears once the pointer is on that place, which is why the pointer is put there first. */
async function closeTab(page: Page): Promise<void> {
  const wrapper = page.locator(
    '[id="pane-strip:content:main"] div:has(> [data-tab-path="sales/quotes/q-0007"])',
  );
  const box = await wrapper.boundingBox();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) - 12,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );
  await wrapper.locator('[data-testid="tab-close"]').click();
}

/* The mark and the close control share a slot, so both are siblings of the tab button and are
   reached through the wrapper the three share. */
function mark(page: Page, path: string) {
  return page.locator(
    `div:has(> [data-tab-path="${path}"]) [data-testid="tab-unsaved"]`,
  );
}

async function openWithNote(page: Page): Promise<void> {
  await page.goto('/sales/quotes');
  await openQuote(page);
  await note(page).fill(NOTE);
}

test('closing a quote with an unsaved note asks, and Cancel keeps both', async ({ page }) => {
  await openWithNote(page);
  await closeTab(page);

  await expect(dialog(page)).toContainText('Unsaved changes');
  await dialog(page).getByRole('button', { name: 'Cancel' }).click();

  await expect(tab(page, 'sales/quotes/q-0007')).toBeVisible();
  await expect(note(page)).toHaveValue(NOTE);
});

test('Discard closes the quote and drops the note', async ({ page }) => {
  await openWithNote(page);
  await closeTab(page);

  await dialog(page).getByRole('button', { name: 'Discard' }).click();
  await expect(tab(page, 'sales/quotes/q-0007')).toHaveCount(0);

  await openQuote(page);
  await expect(note(page)).toHaveValue('');
});

/* Save is offered because the surface implements it, and what it saves outlives the tab. */
test('Save closes the quote and the note is there when it is opened again', async ({ page }) => {
  await openWithNote(page);
  await closeTab(page);

  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(tab(page, 'sales/quotes/q-0007')).toHaveCount(0);

  await openQuote(page);
  await expect(note(page)).toHaveValue(NOTE);
});

/* Hiding is never guarded: switching module leaves the dirty instance alive, and coming back finds
   the note still unsaved rather than a dialog. */
test('switching module with an unsaved note never asks, and the note survives', async ({
  page,
}) => {
  await openWithNote(page);

  const rail = page.getByRole('navigation', { name: 'Left activity bar' });
  await rail.getByRole('button', { name: 'Finance' }).click();
  await expect(page).toHaveURL(/\/finance\/receivables$/);
  await expect(dialog(page)).toHaveCount(0);

  await rail.getByRole('button', { name: 'Sales' }).click();
  await expect(note(page)).toHaveValue(NOTE);
});

/* A workspace reset destroys the arrangement programmatically, so a veto hook would never run —
   the unsaved-changes dialog is what guards it, after the reset's own confirmation. */
test('resetting the workspace with an unsaved note asks first', async ({ page }) => {
  await openWithNote(page);

  await page.getByRole('button', { name: 'Workspaces' }).click();
  await page.getByTestId('workspace-reset').click();
  await dialog(page).getByRole('button', { name: 'OK' }).click();

  await expect(dialog(page)).toContainText('Unsaved changes');
});

/* The unsaved surface is the customer panel, and the tab a visitor actually looks at is the
   document's. Both carry the mark, which is the whole point of asking the arrangement rather than
   the surface on top. */
test('an unsaved note marks the document tab and the panel tab alike', async ({
  page,
}) => {
  await openWithNote(page);

  await expect(mark(page, 'sales/quotes/q-0007')).toBeVisible();
  await expect(mark(page, 'view:quotes.customer')).toBeVisible();
});

test('taking the note back to what was saved clears both marks', async ({
  page,
}) => {
  await openWithNote(page);
  await expect(mark(page, 'sales/quotes/q-0007')).toBeVisible();

  await note(page).fill('');

  await expect(mark(page, 'sales/quotes/q-0007')).toHaveCount(0);
  await expect(mark(page, 'view:quotes.customer')).toHaveCount(0);
});

test('a quote opened again after saving carries the note and no mark', async ({
  page,
}) => {
  await openWithNote(page);
  await closeTab(page);
  await dialog(page).getByRole('button', { name: 'Save' }).click();

  await openQuote(page);

  await expect(note(page)).toHaveValue(NOTE);
  await expect(mark(page, 'sales/quotes/q-0007')).toHaveCount(0);
  await expect(mark(page, 'view:quotes.customer')).toHaveCount(0);
});

/* The row is the plugin's own drawing, from the plugin's own read: the workbench marks tabs and
   knows nothing about a list of quotes. */
test("the quote's row in the list is marked while its note is unsaved", async ({
  page,
}) => {
  await openWithNote(page);

  await page.locator('[data-nav-view="sales/quotes"]').click();
  const row = page.locator('li[data-quote="Q-0007"]');

  await expect(row.getByTestId('quote-unsaved')).toBeVisible();
  await expect(row.getByRole('button')).toHaveAttribute(
    'aria-label',
    /unsaved changes$/,
  );
});

test('the row is unmarked once the note is saved', async ({ page }) => {
  await openWithNote(page);
  await closeTab(page);
  await dialog(page).getByRole('button', { name: 'Save' }).click();

  await page.locator('[data-nav-view="sales/quotes"]').click();
  const row = page.locator('li[data-quote="Q-0007"]');

  await expect(row.getByTestId('quote-unsaved')).toHaveCount(0);
});

