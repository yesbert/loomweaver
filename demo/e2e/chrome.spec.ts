import { expect, test } from '@playwright/test';
import { accountEntry } from './account';

/* The rail's foot and the status bar are contributed by the distribution rather than by a weaver,
   which is the one path no plugin test covers: a wrong region id renders nothing and reports
   nothing. Every assertion here is about something a user can see or click. */

test('the feet of both rails offer workspaces, settings and the account', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Workspaces' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(
    page.locator('[data-rail-item="session.account"]'),
  ).toBeVisible();
});

test('workspaces opens the workspace dialog on the list holding the active one', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Workspaces' }).click();

  await expect(page.getByRole('dialog')).toContainText('Overview');
  await expect(page.getByRole('dialog')).toContainText('Sales');
});

test('settings opens the settings dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();

  await expect(page.getByRole('dialog')).toContainText('Permissions');
});

/* The button carries the palette's own shortcut rather than a copy of it, so a rebind cannot
   leave the label lying. */
test('the status bar offers search with its shortcut, and it opens the palette', async ({
  page,
}) => {
  await page.goto('/');

  const search = page.getByRole('button', { name: 'Command palette' });
  await expect(search).toContainText('Search');
  await expect(search).toContainText(/⌘K|Ctrl\+K/);

  await search.click();
  await expect(page.getByPlaceholder('Type a command…')).toBeVisible();
});

test('signing out leaves the account entry standing, offering the way back in, and it survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  const account = page.locator('[data-rail-item="session.account"]');

  await account.click();
  await expect(page.getByRole('menu')).toContainText('Gambit the Cat');
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await account.click();
  await expect(page.getByRole('menuitem', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.reload();
  await account.click();
  await page.getByRole('menuitem', { name: 'Sign in' }).click();

  await account.click();
  await expect(page.getByRole('menu')).toContainText('Gambit the Cat');
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
});

test('the account menu opens from the keyboard, names who it is about once, and gives the focus back', async ({
  page,
}) => {
  await page.goto('/');
  const account = accountEntry(page);

  await account.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('menu')).toHaveAttribute(
    'aria-label',
    'Gambit the Cat, Accounting',
  );
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Switch account' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(account).toBeFocused();
});
