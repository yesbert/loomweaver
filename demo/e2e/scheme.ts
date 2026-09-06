import { expect, type Page } from '@playwright/test';

/* The scheme toggle lives in the top bar, which folds its entries into a "More" tray when the
   window is too narrow for them, so the toggle is reached through the tray where it has folded. */
export async function chooseScheme(page: Page, name: 'Dark' | 'Light'): Promise<void> {
  const topBar = page.getByRole('banner').first();
  await expect(topBar).toBeVisible();
  const button = page.getByRole('button', { name, exact: true });
  if (!(await button.isVisible())) {
    await topBar.getByRole('button', { name: 'More' }).click();
  }
  await button.click();
}
