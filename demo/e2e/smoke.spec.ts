import { expect, test } from '@playwright/test';
import { chooseScheme } from './scheme';

test('boots the branded shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('lw-shell')).toBeVisible();
  const brand = page.locator('lw-shell-brand');
  await expect(brand.getByText('LoomWeaver Demo')).toBeVisible();
  await expect(brand.getByText('A product built on LoomWeaver')).toBeVisible();
});

test('speaks German as completely as English', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Deutsch' }).click();

  await expect(page.getByRole('button', { name: 'Sprache' })).toContainText('Deutsch');
  await expect(page.getByText('Ein Produkt auf Basis von LoomWeaver')).toBeVisible();
});

test('renders translated labels, never raw keys', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('lw-shell')).toBeVisible();

  const body = (await page.locator('body').innerText()).split('\n');
  const rawKeys = body.filter((line) => /^[a-z][\w]*(\.[a-z][\w]*)+$/.test(line.trim()));

  expect(rawKeys).toEqual([]);
});

test('the theme control switches light and dark', async ({ page }) => {
  await page.goto('/');

  const html = page.locator('html');
  await chooseScheme(page, 'Dark');
  await expect(html).toHaveClass(/dark/);

  await chooseScheme(page, 'Light');
  await expect(html).not.toHaveClass(/dark/);
});

test('loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));

  await page.goto('/');
  await expect(page.locator('lw-shell')).toBeVisible();

  expect(errors).toEqual([]);
});

test('shows the platform version in the status bar', async ({ page }) => {
  await page.goto('/');

  const about = page.getByTestId('about-badge');
  await expect(about).toBeVisible();
  await expect(about.getByTestId('about-badge-version')).toHaveText(
    /^v\d+\.\d+\.\d+(-preview\.\d+)?$/,
  );
  await expect(page.locator('lw-version')).toHaveCount(0);
});
