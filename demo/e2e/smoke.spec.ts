import { expect, test } from '@playwright/test';

/* The demo is built slice by slice, so this suite deliberately asserts only what must hold for
   every slice: the product boots, its chrome is branded, its strings are translated, and the
   console stays quiet. Each slice adds its own spec next to this one. */

test('boots the branded shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('lw-shell')).toBeVisible();
  const brand = page.locator('lw-shell-brand');
  await expect(brand.getByText('LoomWeaver Demo')).toBeVisible();
  await expect(brand.getByText('A product built on LoomWeaver')).toBeVisible();
});

/* Every string this demo shows exists in both languages, from the first slice on. The product's
   own tagline goes through the same namespaced bundle a weaver's strings will. */
test('speaks German as completely as English', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('option', { name: 'Deutsch' }).click();

  await expect(page.getByRole('button', { name: 'Sprache' })).toContainText('Deutsch');
  await expect(page.getByText('Ein Produkt auf Basis von LoomWeaver')).toBeVisible();
});

/* The translation bundles are served as build assets, which means a wrong assets glob does not
   fail the build — it degrades every label to its raw key at runtime. That happened once already
   while the testbed was being renamed, so it is worth a test of its own. */
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
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(html).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Light', exact: true }).click();
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

/* The version and the update affordance live in the status bar. The version is worth an assertion
   of its own: a contribution aimed at a region id the layout does not declare renders nothing and
   reports nothing, which is how the status bar stayed empty until the id was corrected. */
test('shows the platform version in the status bar', async ({ page }) => {
  await page.goto('/');

  const version = page.locator('lw-version');
  await expect(version).toBeVisible();
  await expect(version).toHaveText(/^v\d+\.\d+\.\d+(-preview\.\d+)?$/);
});
