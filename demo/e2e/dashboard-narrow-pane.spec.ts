import { Locator, expect, test } from '@playwright/test';

const WIDE = { width: 1600, height: 900 };
const NARROW = { width: 1024, height: 900 };

function overflowing(root: Locator): Promise<readonly string[]> {
  return root.evaluate((el) => {
    const found: string[] = [];
    const measure = (node: Element) => {
      const box = node as HTMLElement;
      if (box.clientWidth === 0) {
        return;
      }
      if (box.scrollWidth - box.clientWidth > 1) {
        found.push(
          `${box.tagName.toLowerCase()} ${box.scrollWidth}>${box.clientWidth}`,
        );
      }
    };
    for (const node of [el, ...el.querySelectorAll('*')]) {
      measure(node);
    }
    return found;
  });
}

function columnCount(target: Locator): Promise<number> {
  return target.evaluate(
    (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
  );
}

test('the content area, not the window, decides the dashboard layout', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto('/');

  const host = page.locator('lw-content-area main').first();
  await expect(host).toBeVisible();
  const reference = await host.evaluate(
    (el) => getComputedStyle(el).containerName,
  );
  test.skip(
    reference !== 'surface',
    'the pinned @loomweaver/shell predates the named pane reference; this starts testing ' +
      'something the day the demo adopts a release that carries it',
  );

  const cards = page.locator('[data-testid="insights-out"]').locator('..').locator('..');
  const wide = await columnCount(cards);
  expect(wide).toBeGreaterThan(1);

  await page.setViewportSize(NARROW);
  await expect.poll(() => columnCount(cards)).toBeLessThan(wide);
});

test('the dashboard fits a content area the sidebar has narrowed', async ({
  page,
}) => {
  await page.setViewportSize(NARROW);
  await page.goto('/');

  const dashboard = page.getByTestId('insights-dashboard');
  await expect(dashboard).toBeVisible();
  await expect(page.getByTestId('insights-out')).not.toBeEmpty();

  const main = page.locator('lw-content-area main').first();
  expect(await main.evaluate((el) => el.clientWidth)).toBeLessThan(NARROW.width);

  await expect.poll(() => overflowing(dashboard)).toEqual([]);
});

test('one step of the pane is enough for the charts to follow it', async ({
  page,
}) => {
  await page.setViewportSize(WIDE);
  await page.goto('/');

  const cards = ['insights-quoted', 'insights-pipeline'];
  for (const card of cards) {
    await expect(page.getByTestId(card).locator('canvas')).toBeVisible();
  }

  await page.setViewportSize(NARROW);

  for (const card of cards) {
    await expect
      .poll(() =>
        page.getByTestId(card).evaluate((el) => {
          const canvas = el.querySelector('canvas') as HTMLCanvasElement;
          return Math.round(
            canvas.getBoundingClientRect().width -
              el.getBoundingClientRect().width,
          );
        }),
      )
      .toBeLessThanOrEqual(0);
  }

  await expect.poll(() => overflowing(page.getByTestId('insights-dashboard'))).toEqual([]);
});
