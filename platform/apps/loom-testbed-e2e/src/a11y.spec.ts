import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openEntry } from './support/helpers';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_AA)
    .analyze();
  expect(
    violations,
    JSON.stringify(
      violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      null,
      2,
    ),
  ).toEqual([]);
}

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('initial shell (light)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await scan(page);
  });

  test('initial shell (dark)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await scan(page);
  });

  test('settings dialog open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan(page);
  });

  test('about dialog open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'About' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan(page);
  });

  test('language menu open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Language' }).click();
    await expect(page.getByRole('option', { name: 'Deutsch' })).toBeVisible();
    await scan(page);
  });

  test('reset dialog open (filled danger button + guard error)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reset list' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').fill('nope');
    await scan(page);
  });

  test('command search open', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('command-palette-entry').click();
    await expect(
      page.getByRole('combobox', { name: 'Command palette' }),
    ).toBeVisible();
    await scan(page);
  });

  test('search over open work open', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('quick-open-entry').click();
    await expect(
      page.getByRole('combobox', { name: 'Go to open tab…' }),
    ).toBeVisible();
    await scan(page);
  });

  test('content tab strip with closable tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await expect(page.getByTestId('tab-close')).toBeVisible();
    await scan(page);
  });
});
