import { Page, expect, test } from '@playwright/test';

const panes = 'lw-content-grid lw-pane-view';
const otherPane = `${panes}:not([data-address-pane])`;
const entryAside = `${otherPane} lw-testbed-entry-view`;
const HELD_MS = 120;

async function entryBesideOverview(page: Page): Promise<void> {
  await page.goto('/overview');
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await page.goto('/entry/e-01');
  await expect(page.locator('lw-testbed-entry-view')).toBeVisible();
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+\\`);
  await expect(page.locator('lw-testbed-entry-view')).toHaveCount(2);
  await page
    .locator('lw-address-pane-header')
    .getByRole('tab', { name: 'Overview' })
    .click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.locator(entryAside)).toBeVisible();
}

async function pressInto(page: Page, selector: string): Promise<void> {
  await page
    .locator(selector)
    .first()
    .click({ position: { x: 4, y: 4 }, delay: HELD_MS });
}

async function watchRemovals(page: Page, selector: string): Promise<void> {
  await page.evaluate((target) => {
    const element = document.querySelector<HTMLElement>(target);
    if (!element) {
      throw new Error(`nothing matches ${target}`);
    }
    element.dataset['probe'] = 'kept';
    const record = globalThis as unknown as { removals: number };
    record.removals = 0;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (node === element || node.contains(element)) {
            record.removals++;
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }, selector);
}

function removals(page: Page): Promise<number> {
  return page.evaluate(
    () => (globalThis as unknown as { removals: number }).removals,
  );
}

test.describe('The address moves and nothing else does', () => {
  test('a click held like a person holds it, in the pane without the address, lands', async ({
    page,
  }) => {
    await entryBesideOverview(page);

    await page
      .locator(entryAside)
      .getByRole('tab', { name: 'Fields' })
      .click({ delay: HELD_MS });

    await expect(page).toHaveURL(/\/entry\/e-01\/meta$/);
    await expect(
      page.locator('#lw-main-content [data-testid="entry-meta"]'),
    ).toBeVisible();
  });

  test('a surface that is not kept stays the same element as the address moves into its pane and out', async ({
    page,
  }) => {
    await entryBesideOverview(page);
    await watchRemovals(page, entryAside);

    await pressInto(page, entryAside);
    await expect(page).toHaveURL(/\/entry\/e-01$/);
    await expect(
      page.locator('#lw-main-content lw-testbed-entry-view[data-probe="kept"]'),
    ).toBeVisible();

    await pressInto(page, `${otherPane} lw-surface-body`);
    await expect(page).toHaveURL(/\/overview$/);

    await expect(
      page.locator(`${entryAside}[data-probe="kept"]`),
    ).toBeVisible();
    expect(await removals(page)).toBe(0);
  });

  test('a field clicked in the pane without the address keeps its focus', async ({
    page,
  }) => {
    await entryBesideOverview(page);
    const field = page.locator(`${entryAside} textarea`);

    await field.click({ delay: HELD_MS });
    await page.keyboard.type('typed');

    await expect(page).toHaveURL(/\/entry\/e-01$/);
    await expect(
      page.locator('#lw-main-content lw-testbed-entry-view textarea'),
    ).toBeFocused();
    await expect(
      page.locator('#lw-main-content lw-testbed-entry-view textarea'),
    ).toHaveValue(/typed$/);
  });
});
