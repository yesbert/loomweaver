import { Page, expect, test } from '@playwright/test';
import { clickTabInPane, splitNotes } from './support/helpers';

function paneStripsLeftToRight(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('lw-content-grid lw-pane-view')]
      .toSorted(
        (a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x,
      )
      .map((pane) => ({
        address: pane.hasAttribute('data-address-pane'),
        stripId:
          pane.querySelector('[id^="pane-strip:content:"]')?.id ?? 'none',
      })),
  );
}

test('pane ids are stable — handing the URL role around renames no pane', async ({
  page,
}) => {
  await splitNotes(page);
  const before = (await paneStripsLeftToRight(page)).map(
    (pane) => pane.stripId,
  );
  expect(before).toHaveLength(2);
  expect(before).not.toContain('none');

  for (const [side, label] of [
    ['right', 'Notes'],
    ['left', 'Overview'],
    ['right', 'Notes'],
    ['left', 'Notes'],
  ] as const) {
    await clickTabInPane(page, side, label);
    await expect
      .poll(async () =>
        (await paneStripsLeftToRight(page)).map((pane) => pane.stripId),
      )
      .toEqual(before);
  }
});

test('the URL role survives a reload as a pointer: the focused pane is still the URL pane', async ({
  page,
}) => {
  await splitNotes(page);
  await clickTabInPane(page, 'right', 'Notes');
  await expect
    .poll(async () => (await paneStripsLeftToRight(page))[1]?.address)
    .toBe(true);
  const before = (await paneStripsLeftToRight(page)).map(
    (pane) => pane.stripId,
  );

  await page.reload();
  await expect(page.locator('lw-testbed-notes-view textarea')).toHaveCount(2);

  const after = await paneStripsLeftToRight(page);
  expect(after.map((pane) => pane.stripId)).toEqual(before);
  expect(after.map((pane) => pane.address)).toEqual([false, true]);
});
