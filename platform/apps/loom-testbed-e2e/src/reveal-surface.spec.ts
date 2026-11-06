import { expect, test } from '@playwright/test';
import { dragTo, runCommand } from './support/helpers';

test.describe('Reveal a docked surface (finding #29)', () => {
  test('the Focus the entry list palette command activates the list tab in the sidebar', async ({
    page,
  }) => {
    await page.goto('/');
    const left = page.locator('#panel-views-left-panel');
    const library = left.getByRole('tab', { name: 'Entry list' });
    const outline = left.getByRole('tab', { name: 'Outline' });

    await outline.click();
    await expect(outline).toHaveAttribute('aria-selected', 'true');

    const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${module_}+KeyK`);
    await expect(palette).toBeVisible();
    await palette.fill('Focus the entry list');
    await page.getByRole('option', { name: 'Focus the entry list' }).click();

    await expect(library).toHaveAttribute('aria-selected', 'true');
  });

  test('revealing a view moved into the content area activates its tab there', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const entry = page.getByRole('tab', { name: 'E-01' });
    await expect(entry).toBeVisible();

    const strip = (await page
      .locator('lw-address-pane-header [role="tablist"]')
      .boundingBox())!;
    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label^="Entry list"]',
      { x: strip.x + strip.width - 40, y: strip.y + strip.height / 2 },
    );
    const moved = page
      .locator('lw-address-pane-header')
      .getByRole('tab', { name: 'Entry list' });
    await expect(moved).toHaveAttribute('aria-selected', 'true');
    await expect(
      page
        .locator('#panel-views-left-panel')
        .getByRole('tab', { name: 'Entry list' }),
    ).toHaveCount(0);

    await entry.click();
    await expect(moved).toHaveAttribute('aria-selected', 'false');

    const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${module_}+KeyK`);
    await palette.fill('Focus the entry list');
    await page.getByRole('option', { name: 'Focus the entry list' }).click();

    await expect(moved).toHaveAttribute('aria-selected', 'true');
  });
  test('a view standing in its sidebar and in the content area is brought forward where it was current last', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const left = page.locator('#panel-views-left-panel');
    const sidebarCopy = left.getByRole('tab', { name: 'Entry list' });
    const outline = left.getByRole('tab', { name: 'Outline' });

    await sidebarCopy.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Open in content' }).click();
    const stripId = await page
      .locator('lw-pane-view:not([data-address-pane]) [role="tablist"][id^="pane-strip:content:"]')
      .getAttribute('id');
    const pane = page
      .locator('lw-content-grid lw-pane-view')
      .filter({ has: page.locator(`[id="${stripId}"]`) });
    const contentCopy = pane.getByRole('tab', { name: 'Entry list' });
    const notes = pane.getByRole('tab', { name: 'Notes' });
    await expect(contentCopy).toHaveAttribute('aria-selected', 'true');

    await pane.getByTestId('pane-add-tab').click();
    await page.getByRole('menuitem', { name: 'Notes' }).click();
    await expect(notes).toHaveAttribute('aria-selected', 'true');
    await sidebarCopy.click();
    await outline.click();
    await runCommand(page, 'Focus the entry list');

    await expect(sidebarCopy).toHaveAttribute('aria-selected', 'true');
    await expect(notes).toHaveAttribute('aria-selected', 'true');

    await outline.click();
    await contentCopy.click();
    await notes.click();
    await runCommand(page, 'Focus the entry list');

    await expect(contentCopy).toHaveAttribute('aria-selected', 'true');
    await expect(outline).toHaveAttribute('aria-selected', 'true');

    await pane.getByTestId('pane-minimize').click();
    await expect(page.getByTestId('pane-minimized-strip')).toHaveCount(1);
    await runCommand(page, 'Focus the entry list');

    await expect(page.getByTestId('pane-minimized-strip')).toHaveCount(0);
    await expect(contentCopy).toHaveAttribute('aria-selected', 'true');
    await expect(pane.locator('lw-surface-body')).toBeVisible();
  });
});
