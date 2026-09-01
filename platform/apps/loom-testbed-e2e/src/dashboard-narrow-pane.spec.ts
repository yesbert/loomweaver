import { Locator, expect, test } from '@playwright/test';
import { narrowPrimaryPane, splitContentRight } from './support/helpers';

const SECTIONS = ['overview', 'trends', 'export'] as const;

const WIDEST_PANE_UNDER_TEST = 320;

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

test.describe('The dashboard fits the pane it was given', () => {
  for (const section of SECTIONS) {
    test(`${section} does not overflow a narrowed split pane`, async ({
      page,
    }) => {
      await page.goto(`/dashboard/${section}`);
      const pane = page.locator('lw-content-area main').first();
      const dashboard = pane.locator('[data-testid="testbed-dashboard"]');
      await expect(dashboard).toBeVisible();

      const divider = await splitContentRight(page);
      await narrowPrimaryPane(page, divider);

      await expect
        .poll(() => pane.evaluate((el) => el.clientWidth))
        .toBeLessThan(WIDEST_PANE_UNDER_TEST);
      expect(page.viewportSize()?.width).toBeGreaterThan(1280);

      await expect.poll(() => overflowing(dashboard)).toEqual([]);
    });
  }
});
