import { expect, test } from '@playwright/test';
import { rail, railRight } from './support/helpers';

test.describe('Auth gating', () => {
  test('hides an admin-only item and disables a members item until the session qualifies', async ({
    page,
  }) => {
    await page.goto('/');
    const admin = rail(page).getByRole('button', { name: 'Gated rail item' });
    const members = railRight(page).getByRole('button', {
      name: 'Members area',
    });
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });

    await expect(admin).toHaveCount(0);
    await expect(members).toBeVisible();
    await expect(members).toBeDisabled();

    await cycle.click();
    await expect(members).toBeEnabled();
    await expect(admin).toHaveCount(0);

    await cycle.click();
    await expect(admin).toBeVisible();

    await cycle.click();
    await expect(admin).toHaveCount(0);
    await expect(members).toBeDisabled();
  });

  test('gates a bar button (hide), a view tab (hide) and a view action (disable) by session', async ({
    page,
  }) => {
    await page.goto('/');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });
    const adminBar = page.getByRole('button', { name: 'Admin bar item' });
    const adminTab = page.getByRole('tab', { name: 'Admin view' });
    const lockAction = page.getByRole('button', {
      name: 'Sort (members only)',
    });

    await expect(adminBar).toHaveCount(0);
    await expect(adminTab).toHaveCount(0);
    await expect(lockAction).toBeDisabled();

    await cycle.click();
    await expect(lockAction).toBeEnabled();
    await expect(adminBar).toHaveCount(0);
    await expect(adminTab).toHaveCount(0);

    await cycle.click();
    await expect(adminBar).toBeVisible();
    await expect(adminTab).toBeVisible();
  });

  test('the command palette omits an admin-only command until an admin signs in', async ({
    page,
  }) => {
    await page.goto('/');

    const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });
    const palette = page.getByRole('combobox', { name: 'Command palette' });
    const secret = page.getByRole('option', { name: 'Admin-only command' });

    await page.keyboard.press(`${module_}+KeyK`);
    await expect(palette).toBeVisible();
    await palette.fill('Admin-only');
    await expect(secret).toHaveCount(0);
    await page.keyboard.press('Escape');

    await cycle.click();
    await cycle.click();
    await page.keyboard.press(`${module_}+KeyK`);
    await palette.fill('Admin-only');
    await expect(secret).toBeVisible();
  });

  test('a gated content route explains itself in the words that fit the session', async ({
    page,
  }) => {
    await page.goto('/secret');
    const signIn = page.getByRole('heading', { name: 'Sign-in required' });
    const noAccess = page.getByRole('heading', { name: 'No access' });
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });
    await expect(signIn).toBeVisible();

    await cycle.click();
    await expect(signIn).toHaveCount(0);
    await expect(noAccess).toBeVisible();

    await cycle.click();
    await expect(noAccess).toHaveCount(0);
    await expect(page).toHaveURL(/\/secret$/);
  });

  test('ctx.session drives a plugin view readout reactively', async ({
    page,
  }) => {
    await page.goto('/');
    const readout = page.getByTestId('testbed-session');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });

    await expect(readout).toHaveText('signed out');
    await cycle.click();
    await expect(readout).toHaveText('user');
    await cycle.click();
    await expect(readout).toHaveText('user, admin');
  });

  test('a gated route with a login redirect sends an unauthorized visit to the demo login', async ({
    page,
  }) => {
    await page.goto('/admin-area');
    await expect(page).toHaveURL(/\/login\?from=admin-area/);
    await expect(
      page.getByRole('heading', { name: 'Sign in to continue' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Sign in as admin' }).click();
    await expect(page).toHaveURL(/\/admin-area$/);
    await expect(
      page.getByRole('heading', { name: 'Sign in to continue' }),
    ).toHaveCount(0);
  });

  test('a sandboxed iframe surface self-gates on the pushed session', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });

    await expect(surface.getByTestId('sandbox-session')).toHaveText(
      'signed out',
    );
    await expect(surface.getByTestId('sandbox-admin')).toHaveCount(0);

    await cycle.click();
    await cycle.click();
    await expect(surface.getByTestId('sandbox-session')).toHaveText(
      'user, admin',
    );
    await expect(surface.getByTestId('sandbox-admin')).toBeVisible();
  });

  test('revoking `session` stops the push to the surface, live', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });

    await cycle.click();
    await cycle.click();
    await expect(surface.getByTestId('sandbox-session')).toHaveText(
      'user, admin',
    );

    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('button', { name: 'Permissions', exact: true })
      .click();
    await page.getByTestId('perm-sandbox-rpc-session').click();
    await page.keyboard.press('Escape');

    await expect(surface.getByTestId('sandbox-session')).toHaveText(
      'signed out',
    );
    await expect(surface.getByTestId('sandbox-admin')).toHaveCount(0);
  });
});
