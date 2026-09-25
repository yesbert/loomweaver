import { expect, test } from '@playwright/test';
import { openRestSandbox } from './support/helpers';

const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('The testbed can take a picture by hand', () => {
  test('the palette offers the command and the dialog shows what it drew', async ({
    page,
  }) => {
    await openRestSandbox(page);

    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${mod}+KeyK`);
    await expect(palette).toBeVisible();

    await palette.fill('Picture of the workbench');
    await page
      .getByRole('option', { name: 'Picture of the workbench' })
      .click();

    const drawing = page.getByTestId('capture-dialog-image');
    await expect(drawing).toBeVisible({ timeout: 20_000 });
    await expect(drawing).toHaveAttribute('src', /^data:image\/png;base64,/);
  });

  test('the shortcut takes one too', async ({ page }) => {
    await openRestSandbox(page);

    await page.keyboard.press(`${mod}+Alt+KeyP`);

    await expect(page.getByTestId('capture-dialog-image')).toBeVisible({
      timeout: 20_000,
    });
  });
});
