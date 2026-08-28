import { expect, test, type Page } from '@playwright/test';
import { rail } from './support/helpers';

function brandColor(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lw-brand')
      .trim(),
  );
}

function surfaceColor(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lw-surface')
      .trim(),
  );
}

function bodyFont(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).fontFamily);
}

test.describe('Producer theming', () => {
  test('a plugin recolors the whole app via ctx.contributeTheme and reverts on toggle-off', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = rail(page).getByRole('button', {
      name: 'Toggle the plugin theme',
    });
    await expect(toggle).toBeVisible();

    const before = await brandColor(page);
    expect(before).not.toBe('');
    expect(before).not.toBe('#ea580c');

    const beforeFont = await bodyFont(page);
    expect(beforeFont).not.toMatch(/Georgia/i);

    await toggle.click();
    await expect.poll(() => brandColor(page)).toBe('#ea580c');
    await expect.poll(() => bodyFont(page)).toMatch(/Georgia/i);

    await toggle.click();
    await expect.poll(() => brandColor(page)).toBe(before);
    await expect.poll(() => bodyFont(page)).toBe(beforeFont);
  });

  test('dark-mode overrides recolor contributed surface tokens per scheme', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = rail(page).getByRole('button', {
      name: 'Toggle the plugin theme',
    });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect.poll(() => brandColor(page)).toBe('#ea580c');

    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await expect.poll(() => surfaceColor(page)).toBe('#fff8ec');

    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect.poll(() => surfaceColor(page)).toBe('#1a1206');

    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await expect.poll(() => surfaceColor(page)).toBe('#fff8ec');
  });
});
