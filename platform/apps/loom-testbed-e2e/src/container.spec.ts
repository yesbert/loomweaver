import { expect, test } from '@playwright/test';
import { dragTo, rail } from './support/helpers';

test.describe('Container surface / workspace-in-a-tab', () => {
  test('a container tab hosts a nested pane tree of child surfaces scoped to its :id', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');

    await expect(page.locator('lw-container-pane-host')).toBeVisible();
    await expect(page.getByTestId('testbed-ws-sim')).toHaveText(
      /Container alpha/,
    );
    await expect(page).toHaveURL(/\/workspace\/alpha$/);

    const host = page.locator('lw-container-pane-host');
    await expect(host.getByRole('tab', { name: 'Canvas' })).toBeVisible();
    await expect(host.getByRole('tab', { name: 'Details' })).toBeVisible();
  });

  test('inner panes split like the top level and the layout persists (I3)', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    await expect(page.locator('lw-container-pane-host')).toBeVisible();

    await page
      .locator('lw-container-pane-host lw-pane-view')
      .first()
      .getByRole('button', { name: 'Split down' })
      .click();

    await expect(
      page.locator('lw-container-pane-host lw-pane-view'),
    ).toHaveCount(2);
    await expect(page.getByTestId('testbed-ws-sim')).toHaveCount(2);
    await expect(page.getByTestId('testbed-ws-sim').first()).toHaveText(
      /Container alpha/,
    );

    await page.reload();
    await expect(
      page.locator('lw-container-pane-host lw-pane-view'),
    ).toHaveCount(2);
  });

  test('dragging an inner tab to a pane edge splits it (sealed inner drag)', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    const host = page.locator('lw-container-pane-host');
    await expect(host.locator('lw-pane-view')).toHaveCount(1);

    const box = await host.boundingBox();
    if (box === null) {
      throw new Error('no container bounding box');
    }
    await dragTo(
      page,
      'lw-container-pane-host [role="tab"]:has-text("Canvas")',
      {
        x: box.x + box.width - 24,
        y: box.y + box.height / 2,
      },
    );

    await expect(host.locator('lw-pane-view')).toHaveCount(2);
  });

  test('several sims open in parallel, each self-contextualised', async ({
    page,
  }) => {
    await page.goto('/');
    await rail(page).getByRole('button', { name: 'Containers' }).click();

    await expect(
      page.getByRole('tab', { name: 'Container alpha' }),
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Container beta' }),
    ).toBeVisible();

    await expect(page.getByTestId('testbed-ws-sim')).toHaveText(
      /Container beta/,
    );

    await page.getByRole('tab', { name: 'Container alpha' }).click();
    await expect(page.getByTestId('testbed-ws-sim')).toHaveText(
      /Container alpha/,
    );
  });

  test('the inner picker closes a child and reopens it (scoped to declared children, S2)', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    const host = page.locator('lw-container-pane-host');
    await expect(host.getByRole('tab')).toHaveCount(2);

    await host
      .getByRole('tab', { name: 'Details' })
      .locator('..')
      .getByTestId('tab-close')
      .click();
    await expect(host.getByRole('tab')).toHaveCount(1);
    await expect(host.getByRole('tab', { name: 'Canvas' })).toBeVisible();
    await expect(host.getByTestId('tab-close')).toHaveCount(0);

    await host.getByTestId('pane-add-tab').first().click();
    const picker = page.locator('lw-menu');
    await expect(picker.getByText('Canvas', { exact: true })).toBeVisible();
    await picker.getByText('Details', { exact: true }).click();
    await expect(host.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(host.getByTestId('tab-close')).toHaveCount(2);
  });

  test('closing the last tab of the inner primary in a split promotes the neighbour', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    const host = page.locator('lw-container-pane-host');
    await host
      .locator('lw-pane-view')
      .first()
      .getByRole('button', { name: 'Split down' })
      .click();
    await expect(host.locator('lw-pane-view')).toHaveCount(2);

    const firstPane = host.locator('lw-pane-view').first();
    await firstPane.getByTestId('tab-close').first().click();
    await firstPane.getByTestId('tab-close').first().click();

    await expect(host.locator('lw-pane-view')).toHaveCount(1);
    await expect(host.getByRole('tab')).toHaveCount(1);
  });

  test('right-click on an inner tab offers no view context menu (sealed, I2)', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    const host = page.locator('lw-container-pane-host');
    await host.getByRole('tab', { name: 'Canvas' }).click({ button: 'right' });
    await expect(page.locator('lw-menu')).toHaveCount(0);
  });

  test('a workspace tab dragged into a sidebar keeps its sub-tabs (I3 — the tree travels with the tab)', async ({
    page,
  }) => {
    await page.goto('/');
    await rail(page).getByRole('button', { name: 'Containers' }).click();
    await expect(
      page.getByRole('tab', { name: 'Container alpha' }),
    ).toBeVisible();

    const strip = (await page
      .locator('#panel-views-left-panel [role="tablist"]')
      .boundingBox())!;
    await dragTo(
      page,
      'lw-content-area [role="tab"][aria-label="Container alpha"]',
      {
        x: strip.x + strip.width - 24,
        y: strip.y + strip.height / 2,
      },
    );

    await expect(
      page.locator(
        '#panel-views-left-panel [role="tab"][aria-label="Container alpha"]',
      ),
    ).toBeVisible();
    const sideHost = page.locator('lw-shell-panel lw-container-pane-host');
    await expect(sideHost.getByRole('tab', { name: 'Canvas' })).toBeVisible();
    await expect(sideHost.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(sideHost.getByTestId('testbed-ws-sim')).toHaveText(
      /Container alpha/,
    );

    await page.reload();
    await expect(
      page
        .locator('lw-shell-panel lw-container-pane-host')
        .getByRole('tab', { name: 'Canvas' }),
    ).toBeVisible();
  });

  test('a workspace tab pops out into its own window carrying the nested tree (S3)', async ({
    page,
  }) => {
    await page.goto('/popout/workspace/gamma');

    await expect(page.locator('lw-container-pane-host')).toBeVisible();
    await expect(page.getByTestId('testbed-ws-sim')).toHaveText(
      /Container gamma/,
    );
    await expect(page.getByRole('navigation', { name: 'Left activity bar' })).toHaveCount(
      0,
    );
  });

  test('a container-only child never appears as a sidebar view (docks: [])', async ({
    page,
  }) => {
    await page.goto('/workspace/alpha');
    await expect(page.locator('lw-container-pane-host')).toBeVisible();

    await expect(
      page.getByRole('navigation').getByRole('tab', { name: 'Canvas' }),
    ).toHaveCount(0);
  });
});

test.describe('A container declares its arrangement', () => {
  test('opens split as declared, and every instance of the path starts that way', async ({
    page,
  }) => {
    await page.goto('/');
    await rail(page).getByRole('button', { name: 'Arranged container' }).click();
    await expect(page).toHaveURL(/\/arranged\/alpha$/);

    const host = page.locator('lw-container-pane-host');
    await expect(host.locator('lw-pane-view')).toHaveCount(4);
    await expect(host.getByRole('tab', { name: 'Canvas' })).toBeVisible();
    await expect(host.getByRole('tab', { name: 'Details' })).toBeVisible();

    const canvas = await host.locator('lw-pane-view').first().boundingBox();
    const details = await host.locator('lw-pane-view').nth(1).boundingBox();
    if (canvas === null || details === null) {
      throw new Error('no pane bounding box');
    }
    expect(canvas.width).toBeGreaterThan(details.width);
    expect(details.height).toBeLessThan(canvas.height);

    await page.reload();
    await expect(host.locator('lw-pane-view')).toHaveCount(4);

    await page.goto('/arranged/beta');
    await expect(host.locator('lw-pane-view')).toHaveCount(4);
    await expect(page.getByTestId('testbed-ws-sim').first()).toHaveText(
      /Container beta/,
    );
  });

  test('a declared closable:false child keeps its tab, and closing the tab resets the arrangement', async ({
    page,
  }) => {
    await page.goto('/arranged/alpha');
    const host = page.locator('lw-container-pane-host');
    await expect(host.locator('lw-pane-view')).toHaveCount(4);

    const details = host
      .locator('lw-pane-view')
      .filter({ has: page.getByRole('tab', { name: 'Details' }) });
    await expect(details.getByTestId('tab-close')).toHaveCount(0);

    await host
      .locator('lw-pane-view')
      .first()
      .getByRole('button', { name: 'Split down' })
      .click();
    await expect(host.locator('lw-pane-view')).toHaveCount(5);

    await page
      .getByRole('tab', { name: 'Arranged container' })
      .locator('..')
      .getByTestId('tab-close')
      .click();
    await expect(host).toHaveCount(0);

    await page.goto('/arranged/alpha');
    await expect(host.locator('lw-pane-view')).toHaveCount(4);
  });
});
