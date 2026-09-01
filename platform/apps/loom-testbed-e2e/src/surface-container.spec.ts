import { Locator, Page, expect, test } from '@playwright/test';
import { narrowPrimaryPane, splitContentRight } from './support/helpers';

const KPIS = '[data-testid="dash-kpis"]';
const IN_PRIMARY = `${KPIS}:not(lw-content-secondary-pane *)`;
const IN_SECONDARY = `lw-content-secondary-pane ${KPIS}`;

function columnCount(target: Locator): Promise<number> {
  return target.evaluate(
    (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
  );
}

function reference(target: Locator): Promise<{ name: string; type: string }> {
  return target.evaluate((el) => {
    const computed = getComputedStyle(el);
    return { name: computed.containerName, type: computed.containerType };
  });
}

async function openEntryList(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Entry list' }).first().click();
  await expect(page.locator('[data-testid="list-list"]')).toBeVisible();
}

test.describe('A surface is measured against its pane, not the window', () => {
  test('splitting a pane re-lays out the surface inside it', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    const kpis = page.locator(IN_PRIMARY).first();
    await expect(kpis).toBeVisible();
    const viewport = page.viewportSize();
    const whole = await columnCount(kpis);
    expect(whole).toBeGreaterThan(1);

    const divider = await splitContentRight(page);
    await narrowPrimaryPane(page, divider);

    await expect.poll(() => columnCount(kpis)).toBeLessThan(whole);
    expect(page.viewportSize()).toEqual(viewport);
  });

  test('two panes of different widths are laid out differently at the same time', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    const divider = await splitContentRight(page);

    const primary = page.locator(IN_PRIMARY).first();
    const secondary = page.locator(IN_SECONDARY).first();
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();

    await narrowPrimaryPane(page, divider);

    await expect
      .poll(async () => (await columnCount(secondary)) - (await columnCount(primary)))
      .toBeGreaterThan(0);
  });

  test('each host that mounts a surface offers the pane under one name', async ({
    page,
  }) => {
    await page.goto('/');
    await openEntryList(page);
    await page.goto('/dashboard/overview');
    await splitContentRight(page);

    const named = await page.evaluate(() =>
      ['lw-content-area main', 'lw-content-secondary-pane', 'lw-shell-panel'].map(
        (selector) =>
          [...document.querySelectorAll(selector)].some((root) =>
            [root, ...root.querySelectorAll('*')].some(
              (el) =>
                getComputedStyle(el).containerName === 'surface' &&
                getComputedStyle(el).containerType === 'inline-size',
            ),
          ),
      ),
    );
    expect(named).toEqual([true, true, true]);
  });

  test('a surface that brought its own reference keeps it', async ({ page }) => {
    await page.goto('/');
    await openEntryList(page);

    const own = page.locator('lw-testbed-list-view > .\\@container').first();
    await expect(own).toBeAttached();

    const style = await reference(own);
    expect(style.type).toBe('inline-size');
    expect(style.name).not.toBe('surface');
  });
});
