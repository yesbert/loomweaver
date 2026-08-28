import { expect, test } from '@playwright/test';

async function openPermissions(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Permissions', exact: true }).click();
}

test.describe('Plugin permissions', () => {
  test("lists a plugin's granted capabilities and a revocation persists across reload", async ({
    page,
  }) => {
    await page.goto('/');
    await openPermissions(page);

    const nav = page.getByTestId('perm-testbed-navigation');
    await expect(nav).toBeChecked();
    await expect(page.getByTestId('perm-testbed-session')).toBeVisible();

    await nav.click();
    await expect(nav).not.toBeChecked();

    await page.reload();
    await openPermissions(page);
    await expect(page.getByTestId('perm-testbed-navigation')).not.toBeChecked();

    await page.getByTestId('perm-testbed-navigation').click();
    await expect(page.getByTestId('perm-testbed-navigation')).toBeChecked();
  });

  test('each plugin is described by the rung it really runs at', async ({
    page,
  }) => {
    await page.goto('/');
    await openPermissions(page);

    await expect(page.getByTestId('perm-level-testbed')).toHaveText(
      /runs inside this application/i,
    );
    await expect(page.getByTestId('perm-level-testbed')).not.toHaveText(
      /cannot reach this application/i,
    );
    await expect(page.getByTestId('perm-level-sandbox-rpc')).toHaveText(
      /cannot reach this application/i,
    );
  });

  test('a composed frame plugin is listed under its name, or its identifier where it has none', async ({
    page,
  }) => {
    await page.goto('/');
    await openPermissions(page);

    await expect(
      page.getByRole('heading', { name: 'Sandbox (RPC)' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'sandbox-static' }),
    ).toBeVisible();
    await expect(page.getByTestId('perm-sandbox-rpc-session')).toBeVisible();
  });

  test('a blocked action shows a denial toast, and settings stays reachable (no self-lockout)', async ({
    page,
  }) => {
    await page.goto('/');

    await openPermissions(page);
    await page.getByTestId('perm-testbed-ui').click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'About' }).click();
    await expect(
      page.getByText(/a permission it needs is turned off/i),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('lw-settings-dialog')).toBeVisible();
  });

  test('revoking every capability does not brick the plugin on reload (activation is protected)', async ({
    page,
  }) => {
    await page.goto('/');

    await openPermissions(page);
    for (const cap of ['ui', 'host', 'navigation', 'session']) {
      const toggle = page.getByTestId(`perm-testbed-${cap}`);
      if (await toggle.isChecked()) {
        await toggle.click();
      }
    }

    await page.reload();

    await expect(
      page.getByRole('button', { name: 'Settings', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.locator('lw-settings-dialog')).toBeVisible();

    await page
      .getByRole('button', { name: 'Permissions', exact: true })
      .click();
    await expect(page.getByTestId('perm-testbed-session')).not.toBeChecked();
  });

  test('a whole plugin can be turned off and back on, live', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'About' })).toBeVisible();

    await openPermissions(page);
    await expect(page.getByTestId('perm-testbed-session')).toBeVisible();

    await page.getByTestId('plugin-enabled-testbed').click();
    await expect(page.getByTestId('perm-testbed-session')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'About' })).toHaveCount(0);

    await page.getByTestId('plugin-enabled-testbed').click();
    await expect(page.getByTestId('perm-testbed-session')).toBeVisible();
    await expect(page.getByRole('button', { name: 'About' })).toBeVisible();
  });

  test('disabling a sandboxed plugin removes its contributed tab, live', async ({
    page,
  }) => {
    await page.goto('/sandbox-static');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (static tab)' }),
    ).toBeVisible();

    await openPermissions(page);
    await page.getByTestId('plugin-enabled-sandbox-static').click();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (static tab)' }),
    ).toHaveCount(0);

    await openPermissions(page);
    await page.getByTestId('plugin-enabled-sandbox-static').click();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (static tab)' }),
    ).toBeVisible();
  });
});
