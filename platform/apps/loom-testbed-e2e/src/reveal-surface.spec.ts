import { expect, test } from '@playwright/test';
import { runCommand } from './support/helpers';

test.describe('Reveal a docked surface (finding #29)', () => {
  test('the Focus the entry list palette command activates the list tab in the sidebar', async ({
    page,
  }) => {
    await page.goto('/');
    const left = page.locator('#panel-views-primary');
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
    await page.goto('/');
    const left = page.locator('#panel-views-primary');
    await left
      .getByRole('tab', { name: 'Entry list' })
      .click({ button: 'right' });
    await page
      .getByRole('menuitem', { name: 'Open in content', exact: true })
      .click();
    await runCommand(page, 'Home');

    const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${module_}+KeyK`);
    await palette.fill('Focus the entry list');
    await page.getByRole('option', { name: 'Focus the entry list' }).click();

    await expect(
      page.locator('lw-pane-view').getByText('Entry list').first(),
    ).toBeVisible();
  });
});
