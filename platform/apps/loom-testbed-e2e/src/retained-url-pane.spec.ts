import { Page, expect, test } from '@playwright/test';

async function openTwoEntries(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open the entry list' }).click();
  for (const subject of ['Alpha', 'Bravo']) {
    await page
      .getByRole('button', { name: new RegExp(`^${subject}`) })
      .first()
      .dblclick();
  }
  await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();
}

async function splitOffNotes(page: Page): Promise<void> {
  const content = await page.locator('#lw-main-content').boundingBox();
  const tab = await page.getByRole('tab', { name: 'Notes' }).first().boundingBox();
  if (!content || !tab) {
    throw new Error('splitOffNotes: missing geometry');
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

function rendered(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('lw-content-area, lw-pane-view')].map(
      (pane) => {
        const tabs = [...pane.querySelectorAll('[role="tab"]')];
        return {
          active: (
            tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')
              ?.textContent ?? ''
          )
            .trim()
            .replace(/(.+)\1/, '$1'),
          shows: [
            ...pane.querySelectorAll(
              'lw-testbed-notes-view, lw-testbed-entry-view',
            ),
          ]
            .filter((view) => {
              const box = view.getBoundingClientRect();
              return box.width > 0 && box.height > 0;
            })
            .map((view) => view.tagName),
        };
      },
    ),
  );
}

function stripOrders(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('lw-content-area, lw-pane-view')].map((pane) =>
      [...pane.querySelectorAll('lw-pane-tab-strip [role="tab"]')].map((tab) =>
        (tab.textContent ?? '').trim().replace(/(.+)\1/, '$1'),
      ),
    ),
  );
}

async function surfaceIdentity(page: Page): Promise<string> {
  await expect(page.locator('lw-testbed-notes-view')).toBeVisible();
  return page.evaluate(() => {
    const element = document.querySelector<HTMLElement>('lw-testbed-notes-view');
    if (!element) {
      return 'absent';
    }
    element.dataset['probe'] ??= String(performance.now());
    return element.dataset['probe'];
  });
}

test('handing the URL role between panes rebuilds neither the strips nor the retained surface', async ({
  page,
}) => {
  await page.goto('/');
  await openTwoEntries(page);
  await page.goto('/notes');
  await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
  await splitOffNotes(page);

  await page.getByRole('tab', { name: 'Notes' }).first().click();
  const orders = await stripOrders(page);
  const seen = new Set([await surfaceIdentity(page)]);
  expect(seen.has('absent')).toBe(false);

  for (const name of ['E-01', 'Notes', 'E-02', 'Notes', 'E-01', 'Notes']) {
    await page.getByRole('tab', { name }).first().click();
    await expect.poll(() => stripOrders(page)).toEqual(orders);
    seen.add(await surfaceIdentity(page));
  }

  expect(seen.size).toBe(1);
});

test('a retaining surface in a split pane keeps every pane showing its own tab', async ({
  page,
}) => {
  await page.goto('/');
  await openTwoEntries(page);
  await page.goto('/notes');
  await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
  await splitOffNotes(page);

  for (const name of ['E-01', 'E-02', 'Notes', 'E-02', 'E-01', 'Notes']) {
    await page.getByRole('tab', { name }).first().click();
    await expect
      .poll(async () =>
        (await rendered(page)).every(
          (pane) =>
            pane.shows.length === 1 &&
            (pane.active === 'Notes') ===
              (pane.shows[0] === 'LW-TESTBED-NOTES-VIEW'),
        ),
      )
      .toBe(true);
  }
});

interface PaneSnapshot {
  readonly active: string;
  readonly marker: string;
  readonly text: string;
}

function panesLeftToRight(page: Page): Promise<PaneSnapshot[]> {
  return page.evaluate(() => {
    const panes = [
      ...document.querySelectorAll('lw-content-area, lw-pane-view'),
    ].toSorted((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
    return panes.map((pane) => {
      const tabs = [...pane.querySelectorAll('[role="tab"]')];
      const active = (
        tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')
          ?.textContent ?? ''
      )
        .trim()
        .replace(/(.+)\1/, '$1');
      const view = [
        ...pane.querySelectorAll<HTMLElement>('lw-testbed-notes-view'),
      ].find((element) => element.getBoundingClientRect().width > 0);
      return {
        active,
        marker: view?.dataset['marker'] ?? 'none',
        text: view?.querySelector('textarea')?.value ?? '',
      };
    });
  });
}

async function splitAndStamp(page: Page): Promise<void> {
  await page.goto('/overview');
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await page.goto('/notes');
  await expect(page.locator('lw-testbed-notes-view textarea')).toBeVisible();
  const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${module_}+\\`);
  await expect(page.locator('lw-testbed-notes-view textarea')).toHaveCount(2);
  await page.evaluate(() => {
    const views = [
      ...document.querySelectorAll<HTMLElement>('lw-testbed-notes-view'),
    ].toSorted((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
    views[0].dataset['marker'] = 'L';
    views[1].dataset['marker'] = 'R';
  });
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
      ].toSorted(
        (a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x,
      );
      const pane = which === 'left' ? panes[0] : panes.at(-1);
      const tab = [...pane.querySelectorAll('[role="tab"]')].find((element) =>
        (element.textContent ?? '').includes(name),
      );
      tab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    [side, label] as const,
  );
}

test('a surface instance stays in its pane when the URL role moves (TreeWeaver #42)', async ({
  page,
}) => {
  await splitAndStamp(page);

  await clickTabInPane(page, 'right', 'Notes');

  await expect
    .poll(() => panesLeftToRight(page))
    .toEqual([
      expect.objectContaining({ active: 'Notes', marker: 'L' }),
      expect.objectContaining({ active: 'Notes', marker: 'R' }),
    ]);
});

test('state typed into one pane never appears in the other (TreeWeaver #42)', async ({
  page,
}) => {
  await splitAndStamp(page);
  await clickTabInPane(page, 'right', 'Notes');
  await expect
    .poll(async () => (await panesLeftToRight(page))[1].marker)
    .toBe('R');

  await page.evaluate(() => {
    const panes = [
      ...document.querySelectorAll('lw-content-area, lw-pane-view'),
    ].toSorted((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
    panes.at(-1)
      .querySelector<HTMLTextAreaElement>('lw-testbed-notes-view textarea')
      ?.focus();
  });
  await page.keyboard.type('MY-RIGHT-STATE');

  await clickTabInPane(page, 'left', 'Overview');
  await expect
    .poll(() => panesLeftToRight(page))
    .toEqual([
      expect.objectContaining({
        active: expect.stringContaining('Overview') as string,
      }),
      expect.objectContaining({
        active: 'Notes',
        marker: 'R',
        text: 'MY-RIGHT-STATE',
      }),
    ]);

  await clickTabInPane(page, 'left', 'Notes');
  await expect
    .poll(() => panesLeftToRight(page))
    .toEqual([
      expect.objectContaining({ active: 'Notes', marker: 'L', text: '' }),
      expect.objectContaining({
        active: 'Notes',
        marker: 'R',
        text: 'MY-RIGHT-STATE',
      }),
    ]);
});
