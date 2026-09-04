import { expect, test } from '@playwright/test';
import { dragTo } from './support/helpers';

test.describe('Pane edge drag & drop', () => {
  test('dragging a sidebar view tab onto the content right edge MOVES it into a new content group (R2)', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const content = (await page.locator('#lw-main-content').boundingBox())!;

    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      {
        x: content.x + content.width - 12,
        y: content.y + content.height / 2,
      },
    );

    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);

    await expect(
      page.locator('#panel-views-left-panel [role="tab"][aria-label="Outline"]'),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();
    await expect(
      page.locator('#panel-views-left-panel [role="tab"][aria-label="Outline"]'),
    ).toHaveCount(0);
  });

  test('dragging onto the left edge places the new group before the primary one', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const content = (await page.locator('#lw-main-content').boundingBox())!;

    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      {
        x: content.x + 12,
        y: content.y + content.height / 2,
      },
    );

    await expect(
      page.locator('lw-content-secondary-pane lw-testbed-outline-view'),
    ).toBeVisible();

    const pane = (await page
      .locator('lw-content-grid lw-pane-view')
      .boundingBox())!;
    const area = (await page
      .locator('lw-content-grid lw-content-area')
      .boundingBox())!;
    expect(pane.x).toBeLessThan(area.x);
  });

  test('dragging a view tab onto a sidebar bottom edge splits its own panel WITH the tab (R3b)', async ({
    page,
  }) => {
    await page.goto('/');
    const panel = (await page.locator('lw-shell-panel').first().boundingBox())!;

    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      {
        x: panel.x + panel.width / 2,
        y: panel.y + panel.height - 40,
      },
    );

    await expect(
      page.locator('lw-shell-panel lw-pane-view lw-testbed-outline-view'),
    ).toBeVisible();
    await expect(
      page.locator(
        'lw-shell-panel lw-pane-split-handle[aria-orientation="horizontal"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator(
        'lw-shell-panel lw-pane-view [role="tab"][aria-label="Outline"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator('#panel-views-left-panel [role="tab"][aria-label="Outline"]'),
    ).toHaveCount(0);
  });

  test('an empty content area takes the whole drop, and previews it that way', async ({
    page,
  }) => {
    await page.goto('/');
    const content = (await page.locator('#lw-main-content').boundingBox())!;
    const tab = (await page
      .locator('#panel-views-left-panel [role="tab"][aria-label="Outline"]')
      .boundingBox())!;
    const centre = {
      x: content.x + content.width / 2,
      y: content.y + content.height / 2,
    };

    await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2);
    await page.mouse.down();
    await page.mouse.move(centre.x, centre.y, { steps: 12 });
    await page.mouse.move(centre.x, centre.y + 1);

    const preview = page.locator(
      String.raw`#pane-zone\:content\:main\:fill .lw-pane-drop-preview`,
    );
    const box = (await preview.boundingBox())!;
    expect(Math.round(box.width)).toBe(Math.round(content.width));
    expect(Math.round(box.height)).toBe(Math.round(content.height));

    await page.mouse.up();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect(page.locator('lw-testbed-outline-view')).toBeVisible();
    await expect(
      page.locator('lw-content-area [role="tab"][aria-label="Outline"]'),
    ).toHaveCount(1);
  });

  test('closing the emptied URL pane keeps the dragged view visible instead of stranding it', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const content = (await page.locator('#lw-main-content').boundingBox())!;

    await dragTo(
      page,
      '#panel-views-left-panel [role="tab"][aria-label="Outline"]',
      {
        x: content.x + content.width - 12,
        y: content.y + content.height / 2,
      },
    );
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);

    await page
      .locator('lw-content-grid lw-pane-toolbar')
      .first()
      .getByRole('button', { name: 'Close pane' })
      .click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect(
      page.locator('lw-content-area [role="tab"][aria-label="Outline"]'),
    ).toHaveCount(1);
    await expect(page.locator('lw-testbed-outline-view')).toBeVisible();
  });
});
