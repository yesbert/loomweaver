import { Page, expect, test } from '@playwright/test';

function panesLeftToRight(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('lw-content-area, lw-pane-view')]
      .sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
      .map((pane) => ({
        tag: pane.tagName,
        stripId:
          pane.querySelector('[id^="pane-strip:content:"]')?.id ?? 'none',
      })),
  );
}

function clickTabInPane(
  page: Page,
  side: 'left' | 'right',
  label: string,
): Promise<void> {
  return page.evaluate(
    ([which, name]) => {
      const panes = [
        ...document.querySelectorAll('lw-content-area, lw-pane-view'),
      ].sort(
        (a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x,
      );
      const pane = which === 'left' ? panes[0] : panes[panes.length - 1];
      const tab = [...pane.querySelectorAll('[role="tab"]')].find((element) =>
        (element.textContent ?? '').includes(name),
      );
      tab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    [side, label] as const,
  );
}

async function splitNotes(page: Page): Promise<void> {
  await page.goto('/overview');
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await page.goto('/notes');
  await expect(page.locator('lw-testbed-notes-view textarea')).toBeVisible();
  const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${module_}+\\`);
  await expect(page.locator('lw-testbed-notes-view textarea')).toHaveCount(2);
}

test('pane ids are stable — handing the URL role around renames no pane', async ({
  page,
}) => {
  await splitNotes(page);
  const before = (await panesLeftToRight(page)).map((pane) => pane.stripId);
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
        (await panesLeftToRight(page)).map((pane) => pane.stripId),
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
    .poll(async () => (await panesLeftToRight(page))[1]?.tag)
    .toBe('LW-CONTENT-AREA');
  const before = (await panesLeftToRight(page)).map((pane) => pane.stripId);

  await page.reload();
  await expect(page.locator('lw-testbed-notes-view textarea')).toHaveCount(2);

  const after = await panesLeftToRight(page);
  expect(after.map((pane) => pane.stripId)).toEqual(before);
  expect(after.map((pane) => pane.tag)).toEqual([
    'LW-PANE-VIEW',
    'LW-CONTENT-AREA',
  ]);
});
