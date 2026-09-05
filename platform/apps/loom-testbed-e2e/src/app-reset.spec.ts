import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

test.describe('Resetting the app layout (K6)', () => {
  const left = '#panel-views-left-panel';

  test('brings back a hidden rail entry and a collapsed sidebar, and holds over a reload', async ({
    page,
  }) => {
    await page.goto('/');
    const notes = rail(page).getByRole('button', {
      name: 'Notes',
      exact: true,
    });
    await expect(notes).toHaveCount(1);

    await rail(page).click({ button: 'right', position: { x: 20, y: 480 } });
    await page
      .getByRole('menuitem', { name: 'Choose the entries' })
      .click();
    await page.getByRole('button', { name: 'Notes: Hidden' }).click();
    await page.keyboard.press('Escape');
    await expect(notes).toHaveCount(0);

    await page.locator(left).getByRole('button', { name: 'Collapse' }).click();
    await expect(page.locator(left).getByRole('tab')).toHaveCount(0);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset app layout' }).click();
    await page.getByTestId('app-reset-confirm').click();

    await expect(notes).toHaveCount(1);
    await expect(page.locator(left).getByRole('tab').first()).toBeVisible();

    await page.reload();
    await expect(notes).toHaveCount(1);
  });

  test('leaves saved workspaces alone: that is the workspace reset\u{2019}s job', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByPlaceholder('Workspace name').fill('morning');
    await page.getByTestId('workspace-save').click();
    await expect(page.getByRole('button', { name: 'morning' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset app layout' }).click();
    await page.getByTestId('app-reset-confirm').click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByRole('button', { name: 'morning' })).toBeVisible();
  });
});
