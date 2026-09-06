import { type Page } from '@playwright/test';

export function accountEntry(page: Page) {
  return page.locator('[data-rail-item="session.account"]');
}

export async function switchAccount(page: Page): Promise<void> {
  await accountEntry(page).click();
  await page.getByRole('menuitem', { name: 'Switch account' }).click();
}

export async function signOut(page: Page): Promise<void> {
  await accountEntry(page).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
}

export async function signIn(page: Page): Promise<void> {
  await accountEntry(page).click();
  await page.getByRole('menuitem', { name: 'Sign in' }).click();
}
