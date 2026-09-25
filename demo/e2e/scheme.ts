import { expect, type Page } from '@playwright/test';

export async function chooseScheme(page: Page, name: 'Dark' | 'Light'): Promise<void> {
  const topBar = page.getByRole('banner').first();
  await expect(topBar).toBeVisible();
  const button = page.getByRole('button', { name, exact: true });
  if (!(await button.isVisible())) {
    await topBar.getByRole('button', { name: 'More' }).click();
  }
  await button.click();
}
