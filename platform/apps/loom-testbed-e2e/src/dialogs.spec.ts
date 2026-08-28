import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Host dialogs', () => {
  test('opens the settings surface with grouped sections', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByRole('button', { name: 'General' })).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Testbed weaver' }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('opens the About dialog with identity and running version', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'About' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', { name: 'LoomWeaver Testbed' }),
    ).toBeVisible();
    await expect(dialog.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('guards the destructive reset behind a type-to-confirm', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByText('4 items')).toBeVisible();

    await page.getByRole('button', { name: 'Reset list' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const confirm = dialog.getByRole('button', { name: 'Reset list' });
    await expect(confirm).toBeDisabled();

    const guard = dialog.getByRole('textbox');
    await guard.fill('nope');
    await expect(confirm).toBeDisabled();

    await guard.fill('Reset');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('3 items')).toBeVisible();
  });

  test('cancelling the reset leaves the list untouched', async ({ page }) => {
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByText('4 items')).toBeVisible();

    await page.getByRole('button', { name: 'Reset list' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel' })
      .click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('4 items')).toBeVisible();
  });
});
