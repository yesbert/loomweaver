import { expect, Page, test } from '@playwright/test';
import { dragTo, rail } from './support/helpers';

const addressTabs = 'lw-content-area lw-pane-tab-strip [role="tab"]';
const otherTabs = 'lw-pane-view lw-pane-tab-strip [role="tab"]';

function labels(page: Page, selector: string): () => Promise<string[]> {
  return () =>
    page
      .locator(selector)
      .evaluateAll((tabs) =>
        tabs.map((tab) => tab.getAttribute('aria-label') ?? ''),
      );
}

async function splitTrendsOff(page: Page): Promise<void> {
  await page.goto('/');
  await rail(page)
    .getByRole('button', { name: 'Dashboard', exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard\/overview/);
  const content = (await page.locator('#lw-main-content').boundingBox())!;
  await dragTo(page, `${addressTabs}[aria-label="Trends"]`, {
    x: content.x + content.width - 12,
    y: content.y + content.height / 2,
  });
  await expect(
    page.locator('lw-content-grid lw-pane-split-handle'),
  ).toHaveCount(1);
  await expect.poll(labels(page, addressTabs)).toEqual(['Trends']);
  await expect.poll(labels(page, otherTabs)).toEqual(['Overview', 'Export']);
}

test.describe('Undoing a split of tabs that cannot be closed', () => {
  test('a tab dragged out of the address pane is dragged back into the pane it came from', async ({
    page,
  }) => {
    await splitTrendsOff(page);

    const target = (await page.locator(otherTabs).last().boundingBox())!;
    await dragTo(page, `${addressTabs}[aria-label="Trends"]`, {
      x: target.x + target.width - 4,
      y: target.y + target.height / 2,
    });

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect
      .poll(async () =>
        (await labels(page, addressTabs)()).toSorted((a, b) =>
          a.localeCompare(b),
        ),
      )
      .toEqual(['Export', 'Overview', 'Trends']);
  });

  test('closing the pane that carries the address keeps its tab, which cannot be closed', async ({
    page,
  }) => {
    await splitTrendsOff(page);

    await page
      .locator('lw-content-area')
      .getByRole('button', { name: 'Close pane' })
      .click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect
      .poll(async () =>
        (await labels(page, addressTabs)()).toSorted((a, b) =>
          a.localeCompare(b),
        ),
      )
      .toEqual(['Export', 'Overview', 'Trends']);
  });

  test('closing the other pane hands its tabs, which cannot be closed, to the address pane', async ({
    page,
  }) => {
    await splitTrendsOff(page);

    await page
      .locator('lw-pane-view')
      .getByRole('button', { name: 'Close pane' })
      .click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect
      .poll(async () =>
        (await labels(page, addressTabs)()).toSorted((a, b) =>
          a.localeCompare(b),
        ),
      )
      .toEqual(['Export', 'Overview', 'Trends']);
    await expect(page).toHaveURL(/dashboard\/trends/);
  });
});
