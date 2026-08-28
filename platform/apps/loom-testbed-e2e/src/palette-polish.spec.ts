import { expect, test } from '@playwright/test';

const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('Command palette polish (MRU · fuzzy · footer)', () => {
  test('a run command surfaces under "Recently used" and survives a reload', async ({
    page,
  }) => {
    await page.goto('/');

    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${mod}+KeyK`);
    await expect(palette).toBeVisible();
    await expect(page.getByTestId('palette-section-recent')).toHaveCount(0);

    await palette.fill('Focus the entry list');
    await page.getByRole('option', { name: 'Focus the entry list' }).click();

    await page.keyboard.press(`${mod}+KeyK`);
    await expect(page.getByTestId('palette-section-recent')).toBeVisible();
    await expect(page.getByTestId('palette-section-all')).toBeVisible();
    await expect(page.getByRole('option').first()).toHaveText(
      /Focus the entry list/,
    );
    await page.keyboard.press('Escape');

    await page.reload();
    await page.keyboard.press(`${mod}+KeyK`);
    await expect(page.getByTestId('palette-section-recent')).toBeVisible();
    await expect(page.getByRole('option').first()).toHaveText(
      /Focus the entry list/,
    );
  });

  test('the filter matches a subsequence and the footer shows the key hints', async ({
    page,
  }) => {
    await page.goto('/');

    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await page.keyboard.press(`${mod}+KeyK`);
    await expect(palette).toBeVisible();

    const footer = page.getByTestId('palette-footer');
    await expect(footer).toContainText('Select');
    await expect(footer).toContainText('Run');
    await expect(footer).toContainText('Close');

    await palette.fill('fcs entr');
    await expect(
      page.getByRole('option', { name: 'Focus the entry list' }),
    ).toBeVisible();
  });

  test('the dialog is pinned to the top — it never jumps while the list height changes', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press(`${mod}+KeyK`);

    const panel = page.locator('dialog', { has: page.getByRole('listbox') });
    await expect(panel).toBeVisible();
    const before = await panel.boundingBox();
    expect(before && before.y).toBeLessThan(200);

    await page
      .getByRole('combobox', { name: 'Command palette' })
      .fill('zzz-nothing');
    await expect(page.getByRole('option')).toHaveCount(0);
    const after = await panel.boundingBox();

    expect(after?.y).toBe(before?.y);
  });

  test.describe('phone viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('the dialog pins to the top on a phone too — no bottom sheet, no jumping', async ({
      page,
    }) => {
      await page.goto('/');
      await page.keyboard.press(`${mod}+KeyK`);

      const panel = page.locator('dialog', { has: page.getByRole('listbox') });
      await expect(panel).toBeVisible();
      const before = await panel.boundingBox();
      expect(before && before.y).toBeLessThan(200);

      await page
        .getByRole('combobox', { name: 'Command palette' })
        .fill('zzz-nothing');
      await expect(page.getByRole('option')).toHaveCount(0);
      const after = await panel.boundingBox();

      expect(after?.y).toBe(before?.y);
    });
  });

  test('keyboard navigation keeps the highlighted option scrolled into view', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press(`${mod}+KeyK`);
    await expect(
      page.getByRole('combobox', { name: 'Command palette' }),
    ).toBeVisible();

    await page.keyboard.press('ArrowUp');

    await expect(page.getByRole('option').last()).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('option').last()).toBeInViewport();
  });
});
