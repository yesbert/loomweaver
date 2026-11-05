import { expect, test } from '@playwright/test';
import { dragTo } from './support/helpers';

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
});
