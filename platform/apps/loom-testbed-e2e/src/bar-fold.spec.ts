import { expect, Page, test } from '@playwright/test';

const LONG_TAGLINE = 'A tagline long enough to need the room of a button';

async function useLongTagline(page: Page): Promise<void> {
  await page.route('**/i18n/product/en.json', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, tagline: LONG_TAGLINE } });
  });
}

function topBarState(page: Page) {
  return page.getByRole('group', { name: 'Top bar' }).evaluate((bar) => {
    const names = [
      ...bar.querySelectorAll<HTMLElement>(
        '[data-bar-entry="shell.brand"] span',
      ),
    ];
    return {
      nameCut: names.some((name) => name.scrollWidth > name.clientWidth),
      othersShown: bar.querySelectorAll(
        '[data-bar-entry]:not([data-bar-entry="shell.brand"])',
      ).length,
      folded: bar.querySelector('[data-bar-fold]') !== null,
    };
  });
}

test.describe('A top bar that runs out of room', () => {
  test.beforeEach(async ({ page }) => {
    await useLongTagline(page);
    await page.setViewportSize({ width: 1400, height: 800 });
    await page.goto('/');
    await expect(
      page.getByRole('group', { name: 'Top bar' }).locator('lw-shell-brand'),
    ).toContainText(LONG_TAGLINE);
  });

  test('folds a button before it cuts the product name', async ({ page }) => {
    await expect
      .poll(async () => {
        const state = await topBarState(page);
        return state.folded && !state.nameCut && state.othersShown > 0;
      })
      .toBe(true);
    await expect(
      page.getByRole('group', { name: 'Top bar' }).locator('[data-bar-fold]'),
    ).toHaveCount(1);
  });

  test('cuts the name only once every button has folded, and keeps the name in the bar', async ({
    page,
  }) => {
    for (const width of [1300, 1200, 1000, 800]) {
      await page.setViewportSize({ width, height: 800 });
      await expect
        .poll(async () => {
          const state = await topBarState(page);
          return !state.nameCut || state.othersShown === 0;
        })
        .toBe(true);
    }
    await expect
      .poll(() => topBarState(page))
      .toEqual({ nameCut: true, othersShown: 0, folded: true });
    await expect(
      page.getByRole('group', { name: 'Top bar' }).locator('lw-shell-brand img'),
    ).toBeVisible();
  });

  test('gives the buttons back once the window is wide enough again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await expect.poll(async () => (await topBarState(page)).othersShown).toBe(0);

    await page.setViewportSize({ width: 1600, height: 800 });
    await expect
      .poll(() => topBarState(page))
      .toEqual({ nameCut: false, othersShown: 3, folded: false });
    await expect(
      page.getByRole('group', { name: 'Top bar' }).locator('[data-bar-fold]'),
    ).toHaveCount(0);
  });
});
