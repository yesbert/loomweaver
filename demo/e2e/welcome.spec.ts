import { expect, test } from '@playwright/test';

/* The suite starts every test as a visitor the demo has welcomed already; this file starts as one
   it has not, so the welcome is the first thing on screen. */
test.use({ storageState: { cookies: [], origins: [] } });

test('a first visit is welcomed once, and About stays reachable afterwards', async ({ page }) => {
  await page.goto('/');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Welcome to the LoomWeaver demo');
  await expect(dialog.getByTestId('about-docs')).toHaveAttribute('target', '_blank');
  await expect(dialog.getByTestId('about-version')).toContainText(/^v\d/);
  await dialog.getByTestId('about-got-it').click();
  await expect(dialog).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('about-badge')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByTestId('about-badge').click();
  await expect(page.getByRole('dialog')).toContainText('Welcome to the LoomWeaver demo');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'About', exact: true }).click();
  await expect(page.getByRole('dialog').getByTestId('about-body')).toBeVisible();
  await expect(page.getByRole('dialog').getByTestId('about-version')).toContainText(/^v\d/);
});
