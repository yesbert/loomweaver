import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('Curating from a dialog (K5)', () => {
  test('the palette opens the rail dialog, and a place change moves the entry', async ({
    page,
  }) => {
    await page.goto('/');
    const notes = rail(page).getByRole('button', {
      name: 'Notes',
      exact: true,
    });
    const right = page.getByRole('navigation', { name: 'Right toolbar' });
    await expect(notes).toHaveCount(1);

    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${mod}+KeyK`);
    await palette.fill('Customize');
    await page.getByRole('option', { name: 'Customize activity bar' }).click();

    await page.getByRole('button', { name: 'Notes: Right' }).click();
    await page.keyboard.press('Escape');

    await expect(notes).toHaveCount(0);
    await expect(
      right.getByRole('button', { name: 'Notes', exact: true }),
    ).toHaveCount(1);
  });

  test('the search field narrows a long list to one row', async ({ page }) => {
    await page.goto('/');
    await rail(page).click({ button: 'right', position: { x: 20, y: 480 } });
    await page
      .getByRole('menuitem', { name: 'Customize activity bar' })
      .click();

    const rows = page.locator('[data-curation-row]');
    await expect(page.getByTestId('curation-search')).toBeVisible();
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(5);

    await page.getByTestId('curation-search').fill('Notes');

    await expect(rows).toHaveCount(1);
  });

  test('the right-click on empty rail space offers the dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await rail(page).click({ button: 'right', position: { x: 20, y: 480 } });

    await expect(
      page.getByRole('menuitem', { name: 'Customize activity bar' }),
    ).toBeVisible();
  });
});
