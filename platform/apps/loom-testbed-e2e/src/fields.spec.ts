import { expect, test } from '@playwright/test';

test.describe('Input field contract (.lw-field)', () => {
  test('renders host-themed native fields in the Info view', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .locator('#panel-views-secondary')
      .getByRole('tab', { name: 'Info' })
      .click();

    await expect(page.locator('input[type="date"].lw-field')).toBeVisible();
    const notes = page.locator('textarea.lw-field');
    await expect(notes).toBeVisible();

    await notes.fill('Hello fields');
    await expect(notes).toHaveValue('Hello fields');

    const favorite = page.getByRole('checkbox', { name: 'Watch this entry' });
    await expect(favorite).not.toBeChecked();
    await favorite.check();
    await expect(favorite).toBeChecked();

    await expect(page.getByRole('radio', { name: 'medium' })).toBeChecked();
    await page.getByRole('radio', { name: 'high' }).check();
    await expect(page.getByRole('radio', { name: 'high' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'medium' })).not.toBeChecked();
  });
});
