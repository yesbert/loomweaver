import { expect, test } from '@playwright/test';
import { rail, runCommand } from './support/helpers';

test.describe('Workspaces are self-remembering', () => {
  test('switching restores each workspace’s own working state', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByPlaceholder('Workspace name').fill('morning');
    await page.getByTestId('workspace-save').click();
    await expect(page.getByRole('button', { name: 'morning' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page
      .locator('lw-pane-view')
      .getByRole('button', { name: 'Close pane' })
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-default').click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByRole('button', { name: 'morning' }).click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);
  });

  test('reset in the default workspace restores factory defaults and keeps saved workspaces', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByPlaceholder('Workspace name').fill('keep-me');
    await page.getByTestId('workspace-save').click();
    await expect(page.getByRole('button', { name: 'keep-me' })).toBeVisible();

    await page.getByTestId('workspace-default').click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByRole('button', { name: 'keep-me' })).toBeVisible();
    await page.getByRole('button', { name: 'keep-me' }).click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);
  });

  test('“Apply changes” on the active row makes the current arrangement the new baseline', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByPlaceholder('Workspace name').fill('foo');
    await page.getByTestId('workspace-save').click();
    await expect(page.getByTestId('workspace-save-baseline')).toBeDisabled();
    await page.keyboard.press('Escape');

    await page
      .locator('lw-pane-view')
      .getByRole('button', { name: 'Close pane' })
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    const fooRow = page.getByRole('listitem').filter({ hasText: 'foo' });
    await expect(fooRow.getByTestId('workspace-changed')).toBeVisible();
    await expect(page.getByTestId('workspace-save-baseline')).toBeEnabled();
    await page.getByTestId('workspace-save-baseline').click();
    await page
      .getByRole('dialog')
      .filter({ hasText: 'Apply changes' })
      .getByRole('button', { name: 'OK' })
      .click();
    await expect(page.getByTestId('workspace-save-baseline')).toBeDisabled();
    await expect(page.getByTestId('workspace-reset')).toBeDisabled();
    await expect(fooRow.getByTestId('workspace-changed')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);
  });

  test('the default workspace reads clean at boot and after a reset', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(0);
    await expect(page.getByTestId('workspace-reset')).toBeDisabled();
    await page.keyboard.press('Escape');

    await page.goto('/search');
    await expect(page.getByRole('tab', { name: 'Search' })).toBeVisible();
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(1);
    await expect(page.getByTestId('workspace-reset')).toBeEnabled();
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(0);
    await expect(page.getByTestId('workspace-reset')).toBeDisabled();
  });

  test('a dirty editor survives a workspace switch parked — switching never asks', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByPlaceholder('Workspace name').fill('scratch');
    await page.getByTestId('workspace-save').click();
    await expect(page.getByRole('button', { name: 'scratch' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await page.locator('#lw-main-content textarea').fill('SWITCH-DRAFT');

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-default').click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);
    await expect(
      page.getByRole('dialog').filter({ hasText: 'Unsaved changes' }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByRole('button', { name: 'scratch' }).click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'SWITCH-DRAFT',
    );
  });

  test('a parked surface takes the address when clicked, and is never duplicated', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-tab-provided').click();
    await page.getByTestId('workspace-def-testbed.review').click();
    await expect(page).toHaveURL(/\/entry\/e-01$/);
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveCount(1);

    await page.getByRole('tab', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);

    await runCommand(page, 'Notes');
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole('tab', { name: 'Notes' })).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveCount(1);
  });

  test('a developer workspace with an icon stays on one line', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    const withoutIcon = await page
      .getByTestId('workspace-default')
      .boundingBox();

    await page.getByTestId('workspace-tab-provided').click();
    const withIcon = await page
      .getByTestId('workspace-def-testbed.review')
      .boundingBox();

    expect(withIcon?.height).toBe(withoutIcon?.height);
  });

  test('a long list scrolls inside the dialog — the switch and the save field stay put', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const many = Array.from({ length: 25 }, (_, index) => ({
        id: `ws-${index}`,
        name: `Workspace number ${index + 1}`,
        baseline: {},
      }));
      localStorage.setItem('lw.shell.workspaces', JSON.stringify(many));
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();

    const panel = page.getByRole('dialog');
    await expect(panel).toBeInViewport();
    await panel.locator('ul').evaluate((element) => element.scrollTo(0, element.scrollHeight));

    await expect(
      page.getByRole('button', { name: 'Workspace number 25' }),
    ).toBeInViewport();
    await expect(page.getByTestId('workspace-tab-mine')).toBeInViewport();
    await expect(page.getByTestId('workspace-save')).toBeInViewport();
  });

  test('a rail entry switches workspaces, and the marking follows and survives a reload', async ({
    page,
  }) => {
    await page.goto('/');
    const searchEntry = rail(page).getByRole('button', {
      name: 'Search',
      exact: true,
    });
    const notesEntry = rail(page).getByRole('button', {
      name: 'Notes',
      exact: true,
    });
    await expect(searchEntry).toBeVisible();
    await expect(searchEntry).not.toHaveAttribute('aria-current', 'true');

    await searchEntry.click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(searchEntry).toHaveAttribute('aria-current', 'true');
    await expect(notesEntry).not.toHaveAttribute('aria-current', 'true');

    await notesEntry.click();
    await expect(page).toHaveURL(/\/notes$/);
    await expect(notesEntry).toHaveAttribute('aria-current', 'true');
    await expect(searchEntry).not.toHaveAttribute('aria-current', 'true');

    await page.reload();
    await expect(
      rail(page).getByRole('button', { name: 'Notes', exact: true }),
    ).toHaveAttribute('aria-current', 'true');
  });

  test('the sidebar frame belongs to the window: a switch never collapses it', async ({
    page,
  }) => {
    await page.goto('/');
    const navigator = page.locator('#panel-views-primary');
    await expect(navigator).toHaveCount(1);

    await page.getByRole('button', { name: 'Collapse panel' }).first().click();
    await expect(navigator).toHaveCount(0);

    await rail(page)
      .getByRole('button', { name: 'Review', exact: true })
      .click();
    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(navigator).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-tab-mine').click();
    await page.getByTestId('workspace-default').click();
    await expect(navigator).toHaveCount(0);
  });

  test('a workspace that lists a sidebar empty empties it without taking it away', async ({
    page,
  }) => {
    await page.goto('/');
    const strip = page.locator('#panel-views-primary');
    await expect(strip.getByRole('tab')).not.toHaveCount(0);

    await rail(page)
      .getByRole('button', { name: 'Dashboard', exact: true })
      .click();
    await expect(page).toHaveURL(/dashboard\/overview/);
    await expect(strip).toHaveCount(1);
    await expect(strip.getByRole('tab')).toHaveCount(0);

    await rail(page)
      .getByRole('button', { name: 'Review', exact: true })
      .click();
    await expect(strip.getByRole('tab')).toHaveCount(1);
  });

  test('the dialog opens on the list holding the active workspace', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-default')).toBeVisible();
    await expect(page.getByTestId('workspace-def-testbed.review')).toHaveCount(
      0,
    );
    await page.getByTestId('workspace-tab-provided').click();
    await expect(page.getByTestId('workspace-default')).toHaveCount(0);
    await expect(page.getByTestId('workspace-def-testbed.review')).toBeVisible();

    const provided = await page
      .locator('[data-testid^="workspace-def-"]')
      .count();
    await expect(page.getByTestId('workspace-tab-provided')).toContainText(
      `(${provided})`,
    );

    await page.getByTestId('workspace-def-testbed.review').click();

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(
      page.getByTestId('workspace-def-testbed.review'),
    ).toBeVisible();
    await expect(page.getByTestId('workspace-default')).toHaveCount(0);
  });
});

test.describe('User workspaces get initials instead of one shared icon', () => {
  test('derives two letters from the name, and only a colliding newcomer steps aside', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    for (const name of ['Kunden', 'Konten', 'Month End']) {
      await page.getByPlaceholder('Workspace name').fill(name);
      await page.getByTestId('workspace-save').click();
      await expect(page.getByRole('button', { name })).toBeVisible();
    }

    await expect(page.getByTestId('workspace-initials')).toHaveText([
      'KN',
      'KO',
      'ME',
    ]);

    await page.keyboard.press('Escape');
    await page
      .locator('nav')
      .first()
      .click({ button: 'right', position: { x: 20, y: 480 } });
    await page
      .getByRole('menuitem', { name: 'Customize activity bar' })
      .click();
    await page.getByRole('button', { name: 'Kunden: Left' }).first().click();
    await page.keyboard.press('Escape');

    const entry = page.locator('[data-rail-item^="shell.workspace:"]').first();
    await expect(entry.getByTestId('rail-initials')).toHaveText('KN');
    await expect(entry.locator('lw-icon')).toHaveCount(0);
  });
});
