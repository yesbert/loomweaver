import { expect, type Page, test } from '@playwright/test';
import { navEntry } from './nav-tree';
import { tab, tabWithControls } from './tabs';

const NOTE = 'Call back before the quote expires.';

function note(page: Page) {
  return page.getByTestId('quote-note');
}

function dialog(page: Page) {
  return page.getByRole('dialog');
}

async function openQuote(page: Page): Promise<void> {
  await navEntry(page, 'sales/quotes').click();
  await page.locator('li[data-quote="Q-0007"] button').click();
  await expect(note(page)).toBeVisible();
}

async function closeTab(page: Page): Promise<void> {
  const wrapper = tabWithControls(page, 'sales/quotes/q-0007');
  const box = await wrapper.boundingBox();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) - 12,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
  );
  await wrapper.locator('[data-testid="tab-close"]').click();
}

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

test('Save closes the quote and the note is there when it is opened again', async ({ page }) => {
  await openWithNote(page);
  await closeTab(page);

  await dialog(page).getByRole('button', { name: 'Save' }).click();
  await expect(tab(page, 'sales/quotes/q-0007')).toHaveCount(0);

  await openQuote(page);
  await expect(note(page)).toHaveValue(NOTE);
});

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

test('resetting the workspace with an unsaved note asks first', async ({ page }) => {
  await openWithNote(page);

  await page.getByRole('button', { name: 'Workspaces' }).click();
  await page.getByTestId('workspace-reset').click();
  await dialog(page).getByRole('button', { name: 'OK' }).click();

  await expect(dialog(page)).toContainText('Unsaved changes');
});

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

test("the quote's row in the list is marked while its note is unsaved", async ({
  page,
}) => {
  await openWithNote(page);

  await navEntry(page, 'sales/quotes').click();
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

  await navEntry(page, 'sales/quotes').click();
  const row = page.locator('li[data-quote="Q-0007"]');

  await expect(row.getByTestId('quote-unsaved')).toHaveCount(0);
});

