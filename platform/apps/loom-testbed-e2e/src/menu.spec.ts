import { expect, test } from '@playwright/test';

async function openTwoEntries(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Entry list' }).click();

  await page.getByRole('button', { name: 'Alpha' }).dblclick();
  await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
  await page.getByRole('button', { name: 'Bravo' }).dblclick();
  await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();
}

test.describe('Content-tab context menu', () => {
  test('right-click opens the menu; Close Others keeps the target', async ({
    page,
  }) => {
    await openTwoEntries(page);

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();

    await expect(page.locator('lw-menu-item:focus')).toHaveCount(0);

    await expect(
      page.getByRole('menuitem', { name: 'Reveal in the entry list' }),
    ).toBeVisible();

    await page.getByRole('menuitem', { name: 'Close Others' }).click();
    await expect(page.getByRole('tab', { name: 'E-02' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
  });

  test('the Pinned checkbox reflects and toggles the tab pin state', async ({
    page,
  }) => {
    await openTwoEntries(page);

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    const pinned = page.getByRole('menuitemcheckbox', { name: 'Pinned' });
    await expect(pinned).not.toBeChecked();
    await pinned.click();

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await expect(
      page.getByRole('menuitemcheckbox', { name: 'Pinned' }),
    ).toBeChecked();
  });

  test('Escape closes the menu', async ({ page }) => {
    await openTwoEntries(page);
    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

test.describe('Weaver-body context menu (ctx.ui.openMenu)', () => {
  test('right-click a list row opens a host-styled menu; a pick runs in-process', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    await page
      .getByRole('button', { name: 'Alpha' })
      .click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole('menuitem', { name: 'Open entry', exact: true }),
    ).toBeVisible();
    await expect(
      menu.getByRole('menuitem', { name: 'Open preview' }),
    ).toBeVisible();

    await menu
      .getByRole('menuitem', { name: 'Open entry', exact: true })
      .click();
    const tab = page.getByRole('tab', { name: 'E-01' });
    await expect(tab).toBeVisible();
    await expect(tab).not.toHaveClass(/italic/);
  });

  test('Escape closes the weaver-body menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page
      .getByRole('button', { name: 'Alpha' })
      .click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
  });
});

test.describe('Rail-item context menu', () => {
  test('right-click on a rail item opens its own menu slot and runs the command', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByRole('navigation', { name: 'Left activity bar' })
      .getByRole('button', { name: 'Sandbox (iframe)' })
      .click({ button: 'right' });

    await expect(page.getByRole('menu')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'About' })).toBeVisible();

    await expect(
      page.locator(
        'lw-menu.lw-menu--leading lw-menu-item[command="testbed.openSettings"] lw-icon',
      ),
    ).toBeVisible();

    await expect(
      page.locator(
        'lw-menu-item[command="testbed.openSettings"] .lw-menu-item-shortcut',
      ),
    ).toContainText('S');
    await page.getByRole('menuitem', { name: 'Settings' }).click();

    await expect(page.locator('lw-settings-dialog')).toBeVisible();
  });
});
