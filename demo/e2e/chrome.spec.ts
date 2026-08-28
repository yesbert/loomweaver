import { expect, test } from '@playwright/test';

/* The rail's foot and the status bar are contributed by the distribution rather than by a weaver,
   which is the one path no plugin test covers: a wrong region id renders nothing and reports
   nothing. Every assertion here is about something a user can see or click. */

test('the rail foot offers workspaces, settings and sign out', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Workspaces' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('workspaces opens the workspace dialog on the list holding the active one', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Workspaces' }).click();

  await expect(page.getByRole('dialog')).toContainText('Overview');
  await expect(page.getByRole('dialog')).toContainText('Quotes');
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

test('signing out swaps the rail item for a way back in, and it survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('account-name')).toHaveText('Merle Behrens');

  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
  await expect(page.getByTestId('sign-in')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('sign-in')).toBeVisible();

  await page.getByTestId('sign-in').click();
  await expect(page.getByTestId('account-name')).toHaveText('Merle Behrens');
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});
