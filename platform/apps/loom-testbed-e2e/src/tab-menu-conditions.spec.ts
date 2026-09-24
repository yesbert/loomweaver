import { expect, test } from '@playwright/test';
import { dragTo, openEntry } from './support/helpers';

test.describe('A tab menu offers only the entries that can act where the tab stands', () => {
  test('a lone content tab has no split entries, and the toolbar still splits', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    const tab = page.locator(
      'lw-address-pane-header [role="tab"][aria-label="Overview"]',
    );
    await expect(tab).toBeVisible();

    await tab.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Close', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Split right' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('menuitem', { name: 'Split down' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    await expect(
      page.locator(
        'lw-address-pane-header lw-pane-toolbar button[aria-label="Split right"]',
      ),
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Split right' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('a view dragged into the main area is not offered the sidebar moves', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    const strip = (await page
      .locator('lw-address-pane-header [role="tablist"]')
      .boundingBox())!;
    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      { x: strip.x + strip.width - 40, y: strip.y + strip.height / 2 },
    );
    const moved = page.locator(
      'lw-address-pane-header [role="tab"][aria-label="Outline"]',
    );
    await expect(moved).toBeVisible();

    await moved.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Stack below' }),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Hide' })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Open in content' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('menuitem', { name: 'Move to other sidebar' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page
      .locator('#panel-views-left-panel')
      .getByRole('tab', { name: 'Entry list' })
      .click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Open in content' }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Move to other sidebar' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
