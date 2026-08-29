import { Locator, Page, expect, test } from '@playwright/test';
import {
  dragTo,
  openEntry,
  rail,
  railRight,
  useFeatures,
} from './support/helpers';

const SPLIT_HANDLE = 'lw-content-grid lw-pane-split-handle';

function settle(page: Page): Promise<void> {
  return page.waitForTimeout(500);
}

test.describe('Switching a capability off takes the gesture too (K1b)', () => {
  test('content.splitRight/splitDown off: no button, no menu entry, no edge drop, no shortcut', async ({
    page,
  }) => {
    await useFeatures(page, 'split');
    await page.goto('/entry/e-01');

    await expect(
      page.locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      ),
    ).toHaveCount(0);

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Split right' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(
      page,
      '#panel-views-primary [role="tab"][aria-label="Outline"]',
      { x: content.x + content.width - 12, y: content.y + content.height / 2 },
    );
    await page.keyboard.press('Control+\\');
    await page.keyboard.press('Meta+\\');
    await settle(page);
    await expect(page.locator(SPLIT_HANDLE)).toHaveCount(0);
  });

  test('the same gestures still work with the capability on', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(
      page,
      '#panel-views-primary [role="tab"][aria-label="Outline"]',
      { x: content.x + content.width - 12, y: content.y + content.height / 2 },
    );
    await expect(page.locator(SPLIT_HANDLE)).toHaveCount(1);
  });

  test('content.close off: no ×, Delete does nothing, no close entries in the menu', async ({
    page,
  }) => {
    await useFeatures(page, 'close');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');

    const tab = page.getByRole('tab', { name: 'E-01' });
    await expect(page.locator('[data-testid="tab-close"]')).toHaveCount(0);

    await tab.click();
    await tab.press('Delete');
    await settle(page);
    await expect(tab).toBeVisible();

    await tab.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Close', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('menuitem', { name: 'Close others' }),
    ).toHaveCount(0);
  });

  test('content.escalate off: double-clicking a pinned tab does not unpin it', async ({
    page,
  }) => {
    await useFeatures(page, 'escalate');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');

    const tab = page.getByRole('tab', { name: 'E-01' });
    await tab.click({ button: 'right' });
    await page.getByRole('menuitemcheckbox', { name: 'Pinned' }).click();
    await expect(page.locator('[data-testid="tab-unpin"]')).toHaveCount(1);

    await tab.dblclick();
    await settle(page);
    await expect(page.locator('[data-testid="tab-unpin"]')).toHaveCount(1);
  });

  test('content.moveTabs off: a pane tab cannot be dropped onto the URL strip', async ({
    page,
  }) => {
    await useFeatures(page, 'move');
    await page.goto('/search');

    await page
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(page.locator('lw-pane-view [role="tab"]')).toHaveCount(1);

    const strip = (await page
      .locator('lw-content-area [role="tablist"]')
      .boundingBox())!;
    await dragTo(page, 'lw-pane-view [role="tab"]', {
      x: strip.x + strip.width - 40,
      y: strip.y + strip.height / 2,
    });

    await settle(page);
    await expect(page.locator('lw-pane-view [role="tab"]')).toHaveCount(1);
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
  });
});

test.describe('Sidebar and rail capabilities (K1c)', () => {
  const left = '#panel-views-primary';
  const right = '#panel-views-secondary';
  const outline = { name: 'Outline' };

  test('sidebar.resize off: no splitter to drag', async ({ page }) => {
    await useFeatures(page, 'sidebar-resize');
    await page.goto('/');
    await expect(page.getByRole('tab', outline).first()).toBeVisible();

    await expect(
      page.getByRole('separator', { name: 'Resize panel' }),
    ).toHaveCount(0);
  });

  test('sidebar.collapse off: no collapse button', async ({ page }) => {
    await useFeatures(page, 'sidebar-collapse');
    await page.goto('/');
    await expect(page.getByRole('tab', outline).first()).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Collapse panel' }),
    ).toHaveCount(0);
  });

  test('sidebar.curate off: right-clicking the strip opens no checklist', async ({
    page,
  }) => {
    await useFeatures(page, 'sidebar-curate');
    await page.goto('/');
    await page
      .locator(left)
      .click({ button: 'right', position: { x: 5, y: 44 } });

    await settle(page);
    await expect(page.getByRole('menu')).toHaveCount(0);
  });

  test('sidebar.moveViews off: no menu entry and no Alt+Shift+Arrow', async ({
    page,
  }) => {
    await useFeatures(page, 'sidebar-move');
    await page.goto('/');

    const tab = page.locator(left).getByRole('tab', outline);
    await tab.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Move to other sidebar' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    await tab.focus();
    await page.keyboard.press('Alt+Shift+ArrowRight');
    await settle(page);
    await expect(page.locator(right).getByRole('tab', outline)).toHaveCount(0);
    await expect(tab).toBeVisible();
  });

  test('sidebar.stackViews off: no menu entry and no edge drop', async ({
    page,
  }) => {
    await useFeatures(page, 'sidebar-stack');
    await page.goto('/');

    const tab = page.locator(left).getByRole('tab', outline);
    await tab.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Stack below' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    const panel = (await page.locator('lw-shell-panel').first().boundingBox())!;
    await dragTo(page, `${left} [role="tab"][aria-label="Outline"]`, {
      x: panel.x + panel.width / 2,
      y: panel.y + panel.height - 40,
    });

    await settle(page);
    await expect(
      page.locator('lw-shell-panel lw-pane-split-handle'),
    ).toHaveCount(0);
  });

  test('rail.moveItems off: no menu entry and no Alt+Shift+Arrow', async ({
    page,
  }) => {
    await useFeatures(page, 'rail-move');
    await page.goto('/');

    const item = rail(page).getByRole('button').first();
    await item.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Move to other activity bar' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    const before = await railRight(page).getByRole('button').count();
    await item.focus();
    await page.keyboard.press('Alt+Shift+ArrowRight');
    await settle(page);
    await expect(railRight(page).getByRole('button')).toHaveCount(before);
  });
});

test.describe('Reordering and instances: the switch takes the gesture too (K1f)', () => {
  const orderOf = (page: Page, items: string) =>
    page
      .locator(items)
      .evaluateAll((els) =>
        els.map(
          (element) => element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '',
        ),
      );

  const handles = (page: Page, scope: string) =>
    page.locator(`${scope} [data-reorder-id]`);

  const CONTENT_TABS = 'lw-content-area [role="tab"]';
  const VIEW_TABS = '#panel-views-primary [role="tab"]';
  const RAIL_ITEMS = 'lw-shell-rail button[aria-label]';

  test('content.reorderTabs off: no drag handle, and neither Alt+Arrow nor a drag moves a tab', async ({
    page,
  }) => {
    await useFeatures(page, 'reorder');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).dblclick();
    await page.getByRole('button', { name: 'Bravo' }).dblclick();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();

    await expect(handles(page, 'lw-content-area')).toHaveCount(0);
    const before = await orderOf(page, CONTENT_TABS);

    const first = page.getByRole('tab', { name: 'E-01' });
    await first.focus();
    await page.keyboard.press('Alt+ArrowRight');
    await settle(page);
    expect(await orderOf(page, CONTENT_TABS)).toEqual(before);

    const second = (await page
      .getByRole('tab', { name: 'E-02' })
      .boundingBox())!;
    await dragTo(page, 'lw-content-area [role="tab"][aria-label="E-01"]', {
      x: second.x + second.width - 4,
      y: second.y + second.height / 2,
    });
    await settle(page);
    expect(await orderOf(page, CONTENT_TABS)).toEqual(before);
  });

  test('sidebar.reorderViews off: no drag handle, and Alt+Arrow leaves the view tabs alone', async ({
    page,
  }) => {
    await useFeatures(page, 'sidebar-reorder');
    await page.goto('/');
    await expect(page.locator(VIEW_TABS).first()).toBeVisible();

    await expect(handles(page, '#panel-views-primary')).toHaveCount(0);
    const before = await orderOf(page, VIEW_TABS);
    expect(before.length).toBeGreaterThan(1);

    await page.locator(VIEW_TABS).first().focus();
    await page.keyboard.press('Alt+ArrowDown');
    await settle(page);
    expect(await orderOf(page, VIEW_TABS)).toEqual(before);
  });

  test('rail.reorder off: no drag handle, and Alt+Arrow leaves the rail items alone', async ({
    page,
  }) => {
    await useFeatures(page, 'rail-reorder');
    await page.goto('/');
    await expect(rail(page).locator('button').first()).toBeVisible();

    await expect(handles(page, 'lw-shell-rail')).toHaveCount(0);
    const before = await orderOf(page, RAIL_ITEMS);
    expect(before.length).toBeGreaterThan(1);

    await rail(page).locator('button').first().focus();
    await page.keyboard.press('Alt+ArrowDown');
    await settle(page);
    expect(await orderOf(page, RAIL_ITEMS)).toEqual(before);
  });

  test('sidebar.instances off: an instanceable view offers no switcher', async ({
    page,
  }) => {
    await useFeatures(page, 'sidebar-instances');
    await page.goto('/');
    await page
      .locator('#panel-views-primary')
      .getByRole('tab', { name: 'Outline' })
      .click();

    await expect(page.getByTestId('outline-sort')).toBeVisible();
    await expect(page.getByTestId('view-switcher')).toHaveCount(0);
  });
});

test.describe('Workspaces, windows and commands (K1d)', () => {
  test('commands.shortcuts off: no chord fires, and no hint promises one', async ({
    page,
  }) => {
    await useFeatures(page, 'shortcuts');
    await page.goto('/');

    await page.keyboard.press('Control+k');
    await page.keyboard.press('Meta+k');
    await settle(page);
    await expect(
      page.getByRole('combobox', { name: 'Command palette' }),
    ).toHaveCount(0);

    const entry = page.getByTestId('command-palette-entry');
    await expect(entry).toBeVisible();
    await expect(entry.locator('kbd')).toHaveCount(0);

    await entry.click();
    await expect(
      page.getByRole('combobox', { name: 'Command palette' }),
    ).toBeVisible();
    await expect(page.locator('li[role="option"] kbd')).toHaveCount(0);
  });

  test('windows.popout off: neither a tab nor a view offers a new window', async ({
    page,
  }) => {
    await useFeatures(page, 'popout');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Open in new window' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page
      .locator('#panel-views-primary')
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Open in new window' }),
    ).toHaveCount(0);
  });

  test('workspaces off: no commands, no rail entry, no dangling button', async ({
    page,
  }) => {
    await useFeatures(page, 'workspaces');
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Workspaces' })).toHaveCount(
      0,
    );

    await page.getByTestId('command-palette-entry').click();
    const palette = page.getByRole('combobox', { name: 'Command palette' });
    await palette.fill('workspace');
    await expect(page.locator('li[role="option"]')).toHaveCount(0);
  });

  test('a surface declaring closable: false keeps its tab open', async ({
    page,
  }) => {
    await page.goto('/overview');

    const tab = page.getByRole('tab', { name: 'Overview (stays open)' });
    await expect(tab).toBeVisible();
    await expect(tab.locator('..').getByTestId('tab-close')).toHaveCount(0);

    await tab.click();
    await page.keyboard.press('Delete');
    await settle(page);
    await expect(tab).toBeVisible();

    await tab.click({ button: 'right' });
    await expect(
      page.getByRole('menuitem', { name: 'Close', exact: true }),
    ).toHaveCount(0);
  });
});

test.describe('Native right-click belongs to whoever draws no menu (K1e)', () => {
  type Probe = { __event: Event | null };

  async function preventedOnRightClickSeenInCapturePhase(
    page: Page,
    target: Locator,
  ): Promise<boolean | null> {
    await page.evaluate(() => {
      (globalThis as unknown as Probe).__event = null;
      globalThis.addEventListener(
        'contextmenu',
        (event) => {
          (globalThis as unknown as Probe).__event = event;
        },
        { capture: true, once: true },
      );
    });
    await target.first().click({ button: 'right' });
    return page.evaluate(
      () => (globalThis as unknown as Probe).__event?.defaultPrevented ?? null,
    );
  }

  test('a text field inside plugin content keeps its browser menu', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');

    expect(
      await preventedOnRightClickSeenInCapturePhase(
        page,
        page.locator('#lw-main-content textarea'),
      ),
    ).toBe(false);
  });

  test('host chrome that draws its own menu still suppresses the native one', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');

    expect(
      await preventedOnRightClickSeenInCapturePhase(
        page,
        page.getByRole('tab', { name: 'E-01' }),
      ),
    ).toBe(true);
    await expect(page.getByRole('menu')).toBeVisible();
  });
});
