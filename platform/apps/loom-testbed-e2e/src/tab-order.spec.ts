import { Page, expect, test } from '@playwright/test';

const ENTRIES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

async function openEntries(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open the entry list' }).click();
  for (const subject of ENTRIES) {
    await page
      .getByRole('button', { name: new RegExp(`^${subject}`) })
      .first()
      .dblclick();
  }
  await expect(page.getByRole('tab', { name: 'E-05' })).toBeVisible();
}

async function splitOffLastEntry(page: Page): Promise<void> {
  const content = await page.locator('#lw-main-content').boundingBox();
  const tab = await page.getByRole('tab', { name: 'E-05' }).first().boundingBox();
  if (!content || !tab) {
    throw new Error('splitOffLastEntry: missing geometry');
  }
  await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    content.x + content.width - 50,
    content.y + content.height / 2,
    { steps: 18 },
  );
  await page.mouse.move(
    content.x + content.width - 48,
    content.y + content.height / 2 + 1,
  );
  await page.mouse.up();
  await expect(page.locator('lw-pane-view')).toHaveCount(1);
}

function tabOrder(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('lw-content-area, lw-pane-view')]
      .map((pane) => ({
        x: pane.getBoundingClientRect().x,
        order: [...pane.querySelectorAll('[role="tab"]')].map((tab) =>
          (tab.textContent ?? '').trim().replace(/(.+)\1/, '$1'),
        ),
      }))
      .toSorted((a, b) => a.x - b.x)
      .map((pane) => pane.order),
  );
}

test('clicking between two tabs in a narrow pane leaves their order alone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto('/');
  await openEntries(page);
  await splitOffLastEntry(page);

  await page.getByRole('tab', { name: 'E-01' }).first().click();
  await page.getByRole('tab', { name: 'E-04' }).first().click();

  let settled = await tabOrder(page);
  await expect
    .poll(async () => {
      const now = await tabOrder(page);
      const same = JSON.stringify(now) === JSON.stringify(settled);
      settled = now;
      return same;
    })
    .toBe(true);

  for (const name of ['E-01', 'E-04', 'E-01', 'E-04']) {
    await page.getByRole('tab', { name }).first().click();
    await expect.poll(() => tabOrder(page)).toEqual(settled);
  }
});
