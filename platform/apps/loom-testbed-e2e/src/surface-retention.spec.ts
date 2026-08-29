import { expect, test } from '@playwright/test';
import { runCommand } from './support/helpers';

test.describe('Surface retention', () => {
  test('an unsaved draft survives splitting and unsplitting the pane', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page).toHaveURL(/entry\/e-01/);

    await page.locator('#lw-main-content textarea').fill('UNSAVED-DRAFT');

    await page.getByRole('button', { name: 'Split right' }).click();
    await expect(page.locator('lw-content-secondary-pane')).toBeVisible();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'UNSAVED-DRAFT',
    );

    await page.getByRole('button', { name: 'Close pane' }).last().click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'UNSAVED-DRAFT',
    );
  });
});

test.describe('Surface retention (hidden and clean means destroyed)', () => {
  test('a clean surface is destroyed when hidden and rebuilt on return (the default)', async ({
    page,
  }) => {
    await page.goto('/');
    await runCommand(page, 'Search');
    await page.locator('#lw-main-content input[type="search"]').fill('loom');

    await runCommand(page, 'Home');
    await expect(
      page.locator('#lw-main-content input[type="search"]'),
    ).toHaveCount(0);

    await runCommand(page, 'Search');
    await expect(
      page.locator('#lw-main-content input[type="search"]'),
    ).toHaveValue('');
  });

  test('a dirty surface keeps unsaved work across a perspective switch', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await page.locator('#lw-main-content textarea').fill('RETAINED-DRAFT');

    await runCommand(page, 'Search');
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.locator('#lw-main-content textarea')).toHaveCount(0);

    await page.getByRole('tab', { name: 'E-01' }).click();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'RETAINED-DRAFT',
    );
  });

  test('a collapsed sidebar unmounts its content and VIEW_STATE restores it on expand', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .locator('#panel-views-primary')
      .getByRole('tab', { name: 'Outline' })
      .click();
    const sortButton = page.getByTestId('outline-sort');
    await sortButton.click();
    await expect(sortButton).toHaveText(/A–Z/);

    await page.getByRole('button', { name: 'Collapse panel' }).first().click();
    await expect(page.getByTestId('outline-sort')).toHaveCount(0);

    await page.getByRole('button', { name: 'Expand panel' }).first().click();
    await expect(page.getByTestId('outline-sort')).toHaveText(/A–Z/);
  });

  test('closing a dirty tab asks — Cancel keeps it, Discard loses the draft', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await page.locator('#lw-main-content textarea').fill('DIRTY-DRAFT');

    const closeAffordance = page
      .getByRole('tab', { name: 'E-01' })
      .locator('..')
      .getByTestId('tab-close');
    await closeAffordance.click();
    await expect(
      page.getByRole('heading', { name: 'Unsaved changes' }),
    ).toBeVisible();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Cancel' })
      .click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'DIRTY-DRAFT',
    );

    await closeAffordance.click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Discard' })
      .click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page.locator('#lw-main-content textarea')).not.toHaveValue(
      'DIRTY-DRAFT',
    );
  });

  test('Save in the close dialog persists the draft and closes', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .click();
    await page.locator('#lw-main-content textarea').fill('SAVED-VIA-DIALOG');

    await page
      .getByRole('tab', { name: 'E-02' })
      .locator('..')
      .getByTestId('tab-close')
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save' })
      .click();
    await expect(page.getByRole('tab', { name: 'E-02' })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .click();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'SAVED-VIA-DIALOG',
    );
  });

  test('the in-view Save button cleans the surface, so closing needs no dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page
      .getByRole('button', {
        name: 'Charlie',
      })
      .click();
    await page.locator('#lw-main-content textarea').fill('SAVED-IN-VIEW');

    await page.getByTestId('entry-send').click();
    await expect(page.getByTestId('entry-dirty')).toHaveCount(0);

    await page
      .getByRole('tab', { name: 'E-03' })
      .locator('..')
      .getByTestId('tab-close')
      .click();
    await expect(
      page.getByRole('heading', { name: 'Unsaved changes' }),
    ).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'E-03' })).toHaveCount(0);
  });

  test("saveOn: 'hide' auto-saves the notes pad when it is hidden", async ({
    page,
  }) => {
    await page.goto('/');
    await runCommand(page, 'Notes');
    await page.locator('#lw-main-content textarea').fill('AUTOSAVED-NOTE');

    await runCommand(page, 'Home');
    await expect(page.locator('#lw-main-content textarea')).toHaveCount(0);

    await runCommand(page, 'Notes');
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'AUTOSAVED-NOTE',
    );
  });

  test('the closed compact drawer holds no panel content in the DOM', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('/');
    await expect(page.locator('lw-shell-panel')).toHaveCount(0);

    await page.getByRole('button', { name: 'Open panel' }).first().click();
    await expect(
      page.locator('lw-shell-panel lw-pane-tree-view').first(),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Close panel' }).first().click();
    await expect(page.locator('lw-shell-panel')).toHaveCount(0);
  });
});

test.describe('Surface retention (beforeClose + programmatic destruction)', () => {
  test('a sandboxed surface vetoes its close with its own in-iframe dialog (beforeClose over RPC)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const tab = page.getByRole('tab', { name: 'Sandbox (iframe)' });
    await expect(tab).toBeVisible();

    const surface = page.frameLocator('iframe[src*="/sandbox-rpc/view.html"]');
    await surface.getByTestId('sandbox-veto-toggle').check();

    const closeAffordance = tab.locator('..').getByTestId('tab-close');
    await closeAffordance.click();
    await surface.getByTestId('sandbox-veto-keep').click();
    await expect(tab).toBeVisible();

    await closeAffordance.click();
    await surface.getByTestId('sandbox-veto-allow').click();
    await expect(tab).toHaveCount(0);
  });

  test('disabling a plugin with unsaved work asks first — Cancel keeps it, Discard disables', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await page.locator('#lw-main-content textarea').fill('PLUGIN-DIRTY');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('button', { name: 'Permissions', exact: true })
      .click();

    const toggle = page.getByTestId('plugin-enabled-testbed');
    await toggle.click();
    const unsaved = page
      .getByRole('dialog')
      .filter({ hasText: 'Unsaved changes' });
    await unsaved.getByRole('button', { name: 'Cancel' }).click();
    await expect(toggle).toBeChecked();
    await expect(page.getByTestId('perm-testbed-session')).toBeVisible();

    await toggle.click();
    await unsaved.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByTestId('perm-testbed-session')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);
  });

  test('resetting the workspace with unsaved work asks — Cancel aborts, Discard resets', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await page.locator('#lw-main-content textarea').fill('RESET-DIRTY');

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    const unsaved = page
      .getByRole('dialog')
      .filter({ hasText: 'Unsaved changes' });
    await unsaved.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'RESET-DIRTY',
    );

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await unsaved.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);
  });
});

test.describe('Surface retention (a sandboxed surface is hidden, not rebuilt)', () => {
  const testbedFrame = 'iframe[src*="/sandbox-rpc/view.html"]';
  const infoFrame = 'iframe[src*="/sandbox-static/view.html"]';

  test('a retained sandbox surface keeps its own state across a tab switch', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(testbedFrame);
    await surface.getByTestId('sandbox-draft').fill('KEPT-IN-PLACE');

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.locator('lw-testbed-dashboard-view')).toBeVisible();
    await expect(page.locator(testbedFrame)).toHaveCount(1);

    await page.getByRole('tab', { name: 'Sandbox (iframe)' }).click();
    await expect(surface.getByTestId('sandbox-draft')).toHaveValue(
      'KEPT-IN-PLACE',
    );
  });

  test('a retained sandbox surface survives a workspace switch, channel and draft intact', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(testbedFrame);
    await surface.getByTestId('sandbox-draft').fill('KEPT-ACROSS-WORKSPACES');

    await page.getByRole('button', { name: 'Review', exact: true }).click();
    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(page.locator(testbedFrame)).toHaveCount(1);

    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();

    await expect(surface.getByTestId('sandbox-draft')).toHaveValue(
      'KEPT-ACROSS-WORKSPACES',
    );
  });

  test('a sandbox surface that does not retain leaves the DOM when hidden', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();

    const module_ = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${module_}+KeyP`);
    await page.getByRole('combobox').fill('static');
    await page.getByRole('option', { name: /Sandbox \(static tab\)/ }).click();
    await expect(
      page.getByRole('tab', { name: 'Sandbox (static tab)' }),
    ).toBeVisible();
    await expect(page.locator(infoFrame)).toHaveCount(1);

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page.locator('lw-testbed-dashboard-view')).toBeVisible();

    await expect(page.locator(infoFrame)).toHaveCount(0);
    await expect(page.locator(testbedFrame)).toHaveCount(1);
  });

  test('the retained surface keeps its state across its own sub-routes', async ({
    page,
  }) => {
    await page.goto('/sandbox-rpc');
    const surface = page.frameLocator(testbedFrame);
    await surface.getByTestId('sandbox-draft').fill('ACROSS-SUB-ROUTES');

    await surface.getByRole('tab', { name: 'Architecture' }).click();
    await expect(page).toHaveURL(/sandbox-rpc\/architecture$/);
    await expect(surface.getByTestId('sandbox-draft')).toHaveValue(
      'ACROSS-SUB-ROUTES',
    );
  });

  test('a dirty sandbox surface is guarded by the host dialog (setDirty over RPC)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(testbedFrame);
    await surface.getByTestId('sandbox-draft').pressSequentially('DIRTY-RPC');

    const closeAffordance = page
      .getByRole('tab', { name: 'Sandbox (iframe)' })
      .locator('..')
      .getByTestId('tab-close');
    await closeAffordance.click();
    const dialog = page.getByRole('dialog');
    await expect(
      page.getByRole('heading', { name: 'Unsaved changes' }),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();

    await closeAffordance.click();
    await dialog.getByRole('button', { name: 'Discard' }).click();
    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toHaveCount(0);
  });
});
