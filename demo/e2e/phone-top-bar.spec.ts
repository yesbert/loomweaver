import { expect, test } from '@playwright/test';

const PHONE = { width: 390, height: 844 };

test('on a phone the top bar shows the mark alone and keeps every entry inside the viewport', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await page.goto('/sales/customers');

  const brand = page.locator('lw-shell-brand');
  await expect(brand).not.toContainText('LoomWeaver Demo');
  await expect(brand.locator('img')).toHaveAttribute('alt', 'LoomWeaver Demo');

  const language = page.locator('lw-language-switcher .lw-select-trigger');
  await expect(language).not.toContainText('English');
  await expect(language).toHaveAttribute('aria-label', 'Language: English');

  const topBar = page.locator('lw-shell-bar').first();
  for (const button of await topBar.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE.width);
  }
});

test('on a wide window the top bar shows the product name beside the mark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/sales/customers');

  await expect(page.locator('lw-shell-brand')).toContainText('LoomWeaver Demo');
  await expect(page.locator('lw-shell-brand img')).toHaveAttribute('alt', '');
});
