import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('LoomWeaver Testbed shell', () => {
  test('boots and shows the distribution brand', async ({ page }) => {
    await expect(page.getByText('LoomWeaver Testbed')).toBeVisible();
  });

  test('shows the Navigator view with its default items', async ({ page }) => {
    await expect(page.getByText('Item C', { exact: true })).toBeVisible();
    await expect(page.getByText('Item A', { exact: true })).toBeVisible();
    await expect(page.getByText('Item B', { exact: true })).toBeVisible();
  });

  test('adds an item from the status bar and updates the live count', async ({
    page,
  }) => {
    await expect(page.getByText('3 items')).toBeVisible();
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.getByText('4 items')).toBeVisible();
  });

  test('renders a weaver-contributed icon', async ({ page }) => {
    await expect(
      page.locator('lw-icon svg path[d^="M12 3.5l8 4.25"]').first(),
    ).toBeAttached();
  });
});
