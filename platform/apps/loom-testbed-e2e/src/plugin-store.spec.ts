import { expect, test, type Page } from '@playwright/test';

async function openStoreDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Plugin store', exact: true }).click();
  await page.getByTestId('store-browse').click();
}

function storeDialog(page: Page) {
  return page
    .getByRole('dialog')
    .filter({ has: page.getByTestId('store-search') });
}

test.describe('Plugin store (Obsidian-style browse dialog)', () => {
  test('browse: search, maximize, and a detail pane with README', async ({
    page,
  }) => {
    await page.goto('/');
    await openStoreDialog(page);
    const dialog = storeDialog(page);

    await expect(dialog.getByTestId('store-card-store-full')).toBeVisible();
    await expect(dialog.getByTestId('store-card-store-minimal')).toBeVisible();
    await expect(dialog.getByTestId('store-card-store-full')).toContainText(
      'Testbed',
    );
    await expect(
      dialog.getByTestId('store-card-store-full').locator('img'),
    ).toBeVisible();

    await dialog.getByTestId('dialog-maximize').click();
    await expect(dialog.getByTestId('dialog-maximize')).toHaveAttribute(
      'aria-label',
      'Restore',
    );
    await dialog.getByTestId('dialog-maximize').click();

    await dialog.getByTestId('store-search').fill('minimal');
    await expect(dialog.getByTestId('store-card-store-full')).toHaveCount(0);
    await expect(dialog.getByTestId('store-card-store-minimal')).toBeVisible();
    await dialog.getByTestId('store-search').fill('');

    await dialog.getByTestId('store-card-store-full').click();
    const detail = dialog.getByTestId('store-detail');
    await expect(detail).toContainText('by LoomWeaver');
    await expect(detail).toContainText('downloads');
    await expect(dialog.getByTestId('store-repository')).toHaveAttribute(
      'href',
      'https://example.com/plugins/store-full',
    );
    await expect(dialog.getByTestId('store-readme')).toContainText(
      'How this README got here',
    );
  });

  test('installing via the consent dialog spawns the plugin live with its community settings', async ({
    page,
  }) => {
    await page.goto('/');
    await openStoreDialog(page);
    const dialog = storeDialog(page);

    await dialog.getByTestId('store-card-store-full').click();
    await dialog.getByTestId('store-install-store-full').click();
    const consent = page
      .getByRole('dialog')
      .filter({ hasText: 'Install Store plugin (full)?' });
    await expect(consent.getByText('Contribute to the UI')).toBeVisible();
    await expect(consent.getByText('Show dialogs and messages')).toBeVisible();
    await consent.getByRole('button', { name: 'Install', exact: true }).click();

    await expect(
      dialog.getByTestId('store-uninstall-store-full'),
    ).toBeVisible();
    await expect(dialog.getByTestId('store-card-store-full')).toContainText(
      'Installed',
    );

    await dialog.getByTestId('store-tab-installed').click();
    await expect(
      dialog.getByTestId('store-installed-store-full'),
    ).toBeVisible();
    await dialog.getByTestId('store-settings-store-full').click();

    await expect(page.getByText('Community plugins')).toBeVisible();
    const greeting = page.getByLabel('Greeting');
    await expect(greeting).toHaveValue('Hello from the store!');
    await greeting.fill('Moin LoomWeaver');
    await expect(page.getByText('[store-full] Moin LoomWeaver')).toBeVisible();

    await page
      .getByRole('button', { name: 'Permissions', exact: true })
      .click();
    await expect(page.getByTestId('plugin-enabled-store-full')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto('/store-full');
    const storeTab = page.getByRole('tab', { name: 'Store plugin (full)' });
    await expect(storeTab).toBeVisible();
    const surface = page.frameLocator('iframe[src*="/store-full/view.html"]');
    await expect(
      surface.getByRole('heading', { name: /Installed at runtime/ }),
    ).toBeVisible();
  });

  test('the settings page lists installed plugins, survives a reload and uninstalls with confirmation', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'lw.shell.installed-plugins',
        JSON.stringify([
          {
            id: 'store-full',
            name: 'Store plugin (full)',
            entryUrl: '/store-full/plugin.html',
            version: '1.0.0',
            capabilities: ['contributions', 'ui'],
          },
        ]),
      );
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('button', { name: 'Plugin store', exact: true })
      .click();

    await expect(page.getByTestId('store-installed-store-full')).toBeVisible();
    await page.getByTestId('store-settings-search').fill('zzz');
    await expect(page.getByTestId('store-installed-store-full')).toHaveCount(0);
    await page.getByTestId('store-settings-search').fill('');

    await page.getByTestId('store-settings-store-full').click();
    await expect(page.getByLabel('Greeting')).toHaveValue(
      'Hello from the store!',
    );

    await page.reload();
    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('button', { name: 'Plugin store', exact: true })
      .click();
    await expect(page.getByTestId('store-installed-store-full')).toBeVisible();

    await page.getByTestId('store-remove-store-full').click();
    const uninstallConfirm = page
      .getByRole('dialog')
      .filter({ hasText: 'Uninstall Store plugin (full)?' });
    await uninstallConfirm
      .getByRole('button', { name: 'Uninstall', exact: true })
      .click();
    await expect(page.getByTestId('store-installed-store-full')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Store plugin (full)', exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('tab', { name: 'Store plugin (full)' }),
    ).toHaveCount(0);
  });

  test('an older installed version offers an update and re-asks for grown permissions', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'lw.shell.installed-plugins',
        JSON.stringify([
          {
            id: 'store-full',
            name: 'Store plugin (full)',
            entryUrl: '/store-full/plugin.html',
            version: '0.9.0',
            capabilities: ['contributions'],
          },
        ]),
      );
    });
    await page.goto('/');
    await openStoreDialog(page);
    const dialog = storeDialog(page);

    await expect(
      dialog.getByTestId('store-update-badge-store-full'),
    ).toHaveText('Update available');

    await dialog.getByTestId('store-card-store-full').click();
    await dialog.getByTestId('store-update-store-full').click();
    const consent = page
      .getByRole('dialog')
      .filter({ hasText: 'Update Store plugin (full)?' });
    await expect(consent.getByText('Show dialogs and messages')).toBeVisible();
    await expect(consent.getByText('Contribute to the UI')).toHaveCount(0);
    await consent.getByRole('button', { name: 'Update', exact: true }).click();

    await expect(dialog.getByTestId('store-update-store-full')).toHaveCount(0);
    await expect(dialog.getByTestId('store-card-store-full')).toContainText(
      'Installed',
    );
    await expect(dialog.getByTestId('store-detail')).toContainText('v1.0.0');

    await dialog.getByTestId('store-tab-installed').click();
    await expect(
      dialog.getByTestId('store-installed-store-full'),
    ).toContainText('v1.0.0');
    await expect(dialog.getByTestId('store-update-store-full')).toHaveCount(0);

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(
              localStorage.getItem('lw.shell.installed-plugins') ?? '[]',
            )[0]?.version,
        ),
      )
      .toBe('1.0.0');
  });

  test('declining the consent dialog installs nothing', async ({ page }) => {
    await page.goto('/');
    await openStoreDialog(page);
    const dialog = storeDialog(page);

    await dialog.getByTestId('store-card-store-minimal').click();
    await dialog.getByTestId('store-install-store-minimal').click();
    const consent = page
      .getByRole('dialog')
      .filter({ hasText: 'Install Store plugin (minimal)?' });
    await consent.getByRole('button', { name: 'Cancel', exact: true }).click();

    await expect(
      dialog.getByTestId('store-install-store-minimal'),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.goto('/dashboard/overview');
    await expect(
      page.getByRole('tab', { name: 'Store plugin (minimal)' }),
    ).toHaveCount(0);
  });
});
