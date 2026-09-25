import { Frame, Locator, Page, expect } from '@playwright/test';

export async function dragTo(
  page: Page,
  fromSelector: string,
  target: { x: number; y: number },
): Promise<void> {
  const from = await page.locator(fromSelector).boundingBox();
  if (from === null) {
    throw new Error(`dragTo: no bounding box for "${fromSelector}"`);
  }
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 12 });
  await page.mouse.move(target.x, target.y + 1);
  await page.mouse.up();
}

export async function useFeatures(page: Page, flags: string): Promise<void> {
  await page.addInitScript(
    ([value]) => localStorage.setItem('lw.testbed.features', value),
    [flags],
  );
}

const ENTRY_SUBJECTS: Readonly<Record<string, string>> = {
  'E-01': 'Alpha',
  'E-02': 'Bravo',
};

export async function openEntry(page: Page, reference: string): Promise<void> {
  const subject = ENTRY_SUBJECTS[reference];
  if (subject === undefined) {
    throw new Error(`openEntry: no subject known for "${reference}"`);
  }
  await page.getByRole('button', { name: subject }).first().dblclick();
  await expect(page.getByRole('tab', { name: reference })).toBeVisible();
}

export async function openTwoEntries(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Entry list' }).click();
  await openEntry(page, 'E-01');
  await openEntry(page, 'E-02');
}

export function rail(page: Page) {
  return page.getByRole('navigation', {
    name: 'Left activity bar',
    exact: true,
  });
}

export async function runCommand(page: Page, title: string): Promise<void> {
  await page.getByTestId('command-palette-entry').click();
  const palette = page.getByRole('combobox', { name: 'Command palette' });
  await expect(palette).toBeVisible();
  await palette.fill(title);
  await page.getByRole('option', { name: title, exact: true }).first().click();
  await expect(palette).toHaveCount(0);
}

export function railRight(page: Page) {
  return page.getByRole('navigation', {
    name: 'Right activity bar',
    exact: true,
  });
}

export function markWindow(page: Page): Promise<void> {
  return page.evaluate(() => {
    (globalThis as unknown as Record<string, unknown>)['__beforeReload'] = true;
  });
}

export function expectFreshWindow(page: Page) {
  return expect
    .poll(() =>
      page
        .evaluate(
          () =>
            (globalThis as unknown as Record<string, unknown>)[
              '__beforeReload'
            ] === undefined,
        )
        .catch(() => false),
    )
    .toBe(true);
}

export async function splitContentRight(page: Page): Promise<Locator> {
  await page
    .locator(
      'lw-address-pane-header lw-pane-toolbar button[aria-label="Split right"]',
    )
    .click();
  const divider = page.getByRole('separator', { name: 'Resize split' });
  await expect(divider).toBeVisible();
  return divider;
}

export async function narrowPrimaryPane(
  page: Page,
  divider: Locator,
): Promise<void> {
  const floor = (await divider.getAttribute('aria-valuemin')) ?? '';
  for (let press = 0; press < 12; press++) {
    const before = (await divider.getAttribute('aria-valuenow')) ?? '';
    if (before === floor) {
      break;
    }
    await divider.focus();
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(divider).not.toHaveAttribute('aria-valuenow', before);
  }
  await expect(divider).toHaveAttribute('aria-valuenow', floor);
}

export async function closeDirtyTab(page: Page, name: string): Promise<void> {
  const wrapper = page.getByRole('tab', { name }).locator('..');
  await wrapper.getByTestId('tab-unsaved').hover({ force: true });
  await wrapper.getByTestId('tab-close').click();
}

export async function splitNotes(page: Page): Promise<void> {
  await page.goto('/overview');
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await page.goto('/notes');
  await expect(page.locator('lw-testbed-notes-view textarea')).toBeVisible();
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${mod}+\\`);
  await expect(page.locator('lw-testbed-notes-view textarea')).toHaveCount(2);
}

export function clickTabInPane(
  page: Page,
  side: 'left' | 'right',
  label: string,
): Promise<void> {
  return page.evaluate(
    ([which, name]) => {
      const panes = [
        ...document.querySelectorAll('lw-content-grid lw-pane-view'),
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

export async function openRpcSandbox(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
    .click();
}

export const REST_SANDBOX_FRAME = 'iframe[src*="/sandbox-rest/view.html"]';

export async function openRestSandbox(page: Page): Promise<void> {
  await page.goto('/sandbox-rest');
  await expect(page.locator(REST_SANDBOX_FRAME)).toBeAttached({
    timeout: 20_000,
  });
}

export async function restSandboxFrame(page: Page): Promise<Frame> {
  await openRestSandbox(page);
  const frame = await page
    .locator(REST_SANDBOX_FRAME)
    .elementHandle()
    .then((handle) => handle?.contentFrame());
  if (!frame) {
    throw new Error('the sandboxed surface never attached a document');
  }
  await frame.waitForFunction(() => 'LwFrame' in globalThis, undefined, {
    timeout: 20_000,
  });
  return frame;
}
