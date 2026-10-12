import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function openRowMenu(page: Page) {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Entry list' }).click();
  await page.getByRole('button', { name: 'Alpha' }).click({ button: 'right' });
  const outer = page.getByRole('menu').first();
  await expect(outer).toBeVisible();
  return outer;
}

test.describe('A menu entry opens a submenu', () => {
  test('the pointer opens it beside its entry, and a choice in it runs and closes both', async ({
    page,
  }) => {
    const outer = await openRowMenu(page);
    const move = outer.getByRole('menuitem', { name: 'Move', exact: true });
    await expect(move).toHaveAttribute('aria-haspopup', 'menu');

    await move.hover();
    const submenu = page.getByRole('menu').nth(1);
    const up = page.getByRole('menuitem', { name: 'Up', exact: true });
    await expect(up).toBeVisible();
    await expect(move).toHaveAttribute('aria-expanded', 'true');

    const entry = await move.boundingBox();
    const opened = await submenu.boundingBox();
    expect(opened?.x).toBeGreaterThanOrEqual(
      (entry?.x ?? 0) + (entry?.width ?? 0),
    );
    expect(Math.abs((opened?.y ?? 0) - (entry?.y ?? 0))).toBeLessThan(8);
    await expect(up.locator('.lw-menu-item-shortcut')).toHaveText(/↑/);

    await up.click();

    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByText('Moved the entry')).toBeVisible();
  });

  test('the keyboard walks into a submenu and back out, and the audit passes with it open', async ({
    page,
  }) => {
    const outer = await openRowMenu(page);
    const status = outer.getByRole('menuitem', {
      name: 'Set status',
      exact: true,
    });
    for (let step = 0; step < 4; step++) {
      await page.keyboard.press('ArrowDown');
    }
    await expect(status).toBeFocused();

    await page.keyboard.press('ArrowRight');
    const waiting = page.getByRole('menuitem', {
      name: 'Waiting',
      exact: true,
    });
    await expect(
      page.getByRole('menuitem', { name: 'Open', exact: true }),
    ).toBeFocused();
    await expect(waiting.locator('.lw-menu-item-lead lw-icon')).toHaveAttribute(
      'name',
      'testbedWaiting',
    );

    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_AA)
      .analyze();
    expect(violations.map((v) => v.id)).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(waiting).toBeHidden();
    await expect(status).toBeFocused();
    await expect(outer).toBeVisible();

    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByText('Changed the status')).toBeVisible();
  });
});
