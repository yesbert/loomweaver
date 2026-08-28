import { Page, expect } from '@playwright/test';

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

const TICKET_SUBJECTS: Readonly<Record<string, string>> = {
  'E-01': 'Alpha',
  'E-02': 'Bravo',
};

export async function openEntry(page: Page, reference: string): Promise<void> {
  const subject = TICKET_SUBJECTS[reference];
  if (subject === undefined) {
    throw new Error(`openEntry: no subject known for "${reference}"`);
  }
  await page.getByRole('button', { name: subject }).first().dblclick();
  await expect(page.getByRole('tab', { name: reference })).toBeVisible();
}

export function rail(page: Page) {
  return page.getByRole('navigation', { name: 'Toolbar', exact: true });
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
  return page.getByRole('navigation', { name: 'Right toolbar', exact: true });
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
            (globalThis as unknown as Record<string, unknown>)['__beforeReload'] ===
            undefined,
        )
        .catch(() => false),
    )
    .toBe(true);
}
