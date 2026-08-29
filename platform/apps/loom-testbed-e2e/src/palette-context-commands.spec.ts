import { expect, test } from '@playwright/test';

const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('Command palette omits context-only commands', () => {
  test('the tab/view context commands do not leak into the palette', async ({
    page,
  }) => {
    await page.goto('/');

    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${module_}+KeyK`);
    await expect(palette).toBeVisible();

    await palette.fill('Focus');
    await expect(
      page.getByRole('option', { name: 'Focus the entry list' }),
    ).toBeVisible();

    await palette.fill('Close');
    await expect(
      page.getByRole('option', { name: 'Close Others' }),
    ).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Close All' })).toHaveCount(
      0,
    );
    await palette.fill('Stack below');
    await expect(page.getByRole('option', { name: 'Stack below' })).toHaveCount(
      0,
    );
  });
});
