import { expect, test } from '@playwright/test';

const isMac = process.platform === 'darwin';

test.describe('Command palette entry & bar shortcut hints', () => {
  test('the built top-bar palette entry shows the OS shortcut and opens the palette (LWF-05)', async ({
    page,
  }) => {
    await page.goto('/');

    const entry = page.getByTestId('command-palette-entry');
    await expect(entry).toBeVisible();
    await expect(entry.locator('kbd')).toHaveText(isMac ? '⌘K' : 'Ctrl+K');

    await entry.click();
    await expect(
      page.getByRole('combobox', { name: 'Command palette' }),
    ).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: 'Command palette' }),
    ).toBeVisible();
  });

  test('the built status-bar quick-open entry shows the OS shortcut and opens the search over open work', async ({
    page,
  }) => {
    await page.goto('/');

    const entry = page.getByTestId('quick-open-entry');
    await expect(entry).toBeVisible();
    await expect(entry.locator('kbd')).toHaveText(isMac ? '⌘P' : 'Ctrl+P');

    await entry.click();
    const search = page.getByRole('combobox', { name: 'Go to open tab…' });
    await expect(search).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: 'Go to open tab…' }),
    ).toBeVisible();

    await search.fill('over');
    await expect(search).toHaveValue('over');
    await expect(
      page.getByRole('combobox', { name: 'Go to open tab…' }),
    ).toBeVisible();
  });

  test('a bar button renders its command shortcut hint, OS-correct (LWF-04)', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.locator('kbd', { hasText: isMac ? '⌘↵' : 'Ctrl+Enter' }),
    ).toBeVisible();
  });

  test('the built palette entry matches the height of its top-bar neighbours (LWF-06)', async ({
    page,
  }) => {
    await page.goto('/');

    const entry = page.getByTestId('command-palette-entry');
    await expect(entry).toBeVisible();
    const entryBox = await entry.boundingBox();
    const toggleBox = await page
      .locator('lw-theme-toggle fieldset.lw-segmented')
      .boundingBox();

    expect(entryBox?.height).toBe(toggleBox?.height);
  });

  test('the language switcher matches the height of the segmented controls (LWF-08)', async ({
    page,
  }) => {
    await page.goto('/');

    const selectBox = await page
      .locator('lw-language-switcher .lw-select-trigger')
      .boundingBox();
    const toggleBox = await page
      .locator('lw-theme-toggle fieldset.lw-segmented')
      .boundingBox();

    expect(selectBox?.height).toBe(toggleBox?.height);
  });

  test('Workspaces and Split editor carry distinct icons in the palette (finding #33)', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByTestId('command-palette-entry').click();
    await expect(
      page.getByRole('option', { name: 'Workspaces' }).locator('lw-icon'),
    ).toHaveAttribute('name', 'workspaces');
    await expect(
      page.getByRole('option', { name: 'Split editor' }).locator('lw-icon'),
    ).toHaveAttribute('name', 'splitPanes');
  });
});
