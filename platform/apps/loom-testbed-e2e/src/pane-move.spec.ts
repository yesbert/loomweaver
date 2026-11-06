import { expect, Page, test } from '@playwright/test';
import { dragTo, openEntry } from './support/helpers';

async function chooseByKeyboard(page: Page, name: string | RegExp) {
  const item = page.getByRole('menuitem', { name });
  await expect(item).toBeVisible();
  for (let step = 0; step < 20; step += 1) {
    if (await item.evaluate((element) => element === document.activeElement)) {
      break;
    }
    await page.keyboard.press('ArrowDown');
  }
  await expect(item).toBeFocused();
  await page.keyboard.press('Enter');
}

test.describe('Tab move semantics', () => {
  test('tab menu "Split right" MOVES a router-bound doc tab into a new group that takes the URL', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Split right' }).click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);

    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(
      page
        .locator(
          '#lw-main-content lw-testbed-entry-view, #lw-main-content textarea',
        )
        .first(),
    ).toBeVisible();

    await expect(
      page.locator(
        'lw-pane-view:not([data-address-pane]) lw-pane-tab-strip [role="tab"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'lw-pane-view:not([data-address-pane]) lw-pane-tab-strip [role="tab"][aria-label="E-02"]',
      ),
    ).toHaveCount(1);

    await expect(
      page.locator(
        'lw-pane-view:not([data-address-pane]) lw-testbed-entry-view',
      ),
    ).toBeVisible();
    await expect(
      page.locator(
        'lw-pane-view:not([data-address-pane]) lw-testbed-entry-view',
      ),
    ).toContainText('E-02');

    await page
      .locator('lw-pane-view:not([data-address-pane]) lw-testbed-entry-view')
      .click();
    await expect(page).toHaveURL(/entry\/e-02/);

    await page.reload();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);
  });

  test('tab menu "Split down" MOVES the tab into a new group stacked below', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Split down' }).click();

    await expect(
      page.locator(
        'lw-content-grid lw-pane-split-handle[aria-orientation="horizontal"]',
      ),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);
    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(
      page.locator(
        'lw-pane-view:not([data-address-pane]) lw-pane-tab-strip [role="tab"][aria-label="E-02"]',
      ),
    ).toHaveCount(1);
  });

  test('dragging a router-bound doc tab onto a content edge splits WITH the tab; the source loses it', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');
    await expect(page).toHaveURL(/entry\/e-02/);

    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(page, '[role="tab"][aria-label="E-01"]', {
      x: content.x + content.width - 12,
      y: content.y + content.height / 2,
    });

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(1);
    await expect(page).toHaveURL(/entry\/e-01/);
  });

  test('dropping a pane tab onto the URL strip moves it into the URL group; the emptied pane collapses', async ({
    page,
  }) => {
    await page.goto('/search');

    await page
      .locator(
        'lw-address-pane-header lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(
      page.locator('lw-pane-view:not([data-address-pane]) [role="tab"]'),
    ).toHaveCount(1);

    await page.goto('/dashboard/overview');
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

    const strip = (await page
      .locator('lw-address-pane-header [role="tablist"]')
      .boundingBox())!;
    await dragTo(page, 'lw-pane-view:not([data-address-pane]) [role="tab"]', {
      x: strip.x + strip.width - 40,
      y: strip.y + strip.height / 2,
    });

    await expect(
      page.locator('lw-pane-view:not([data-address-pane])'),
    ).toHaveCount(0);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/search$/);
  });

  test('a tab moves into another pane from its menu without a pointer, is announced and keeps the focus', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    const moved = page.getByRole('tab', { name: 'E-01', exact: true });
    const announced = page.locator('.cdk-live-announcer-element');
    const splits = page.locator('lw-content-grid lw-pane-split-handle');
    await moved.focus();
    await page.keyboard.press('ContextMenu');
    await chooseByKeyboard(page, 'Split right');

    await expect(splits).toHaveCount(1);
    await expect(moved).toBeFocused();
    await expect(announced).toContainText('E-01 moved to a new pane');

    await page.keyboard.press('ContextMenu');
    await chooseByKeyboard(page, 'Move to Pane…');
    await chooseByKeyboard(page, /^Pane 1: E-02/);

    await expect(splits).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'E-02', exact: true })).toHaveCount(1);
    await expect(moved).toBeFocused();
    await expect(announced).toContainText('E-01 moved to pane 1');
  });
});
