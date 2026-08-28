import { expect, test } from '@playwright/test';
import { dragTo, openEntry, useFeatures } from './support/helpers';

test.describe('Every tab is draggable — focus handoff on arrival', () => {
  test('a router-bound doc tab dragged to an edge splits WITH it; the target becomes the URL pane, renders the doc, URL follows, and focus is reversible (R6/R9)', async ({
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
    await expect(
      page.locator('lw-content-area lw-testbed-entry-view'),
    ).toContainText('E-01');

    await expect(
      page.locator(
        'lw-pane-view lw-pane-tab-strip [role="tab"][aria-label="E-02"]',
      ),
    ).toHaveCount(1);
    await expect(
      page.locator('lw-pane-view lw-testbed-entry-view'),
    ).toContainText('E-02');

    await page.locator('lw-pane-view lw-testbed-entry-view').click();
    await expect(page).toHaveURL(/entry\/e-02/);

    await page.reload();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
  });

  test('an iframe (sandbox) tab dragged to an edge splits WITH it; the surface renders in the new pane and the URL follows (R6)', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/sandbox-rpc/);

    const content = (await page.locator('#lw-main-content').boundingBox())!;
    await dragTo(page, '[role="tab"][aria-label="Sandbox (iframe)"]', {
      x: content.x + content.width - 12,
      y: content.y + content.height / 2,
    });

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page).toHaveURL(/sandbox-rpc/);
    const surface = page.frameLocator(
      'lw-content-area iframe[src*="/sandbox-rpc/view.html"]',
    );
    await expect(
      surface.getByRole('heading', { name: /isolated iframe/ }),
    ).toBeVisible();
  });
});

test.describe('A focus handoff leaves no phantom tab behind', () => {
  test('a double-click on a preview tab keeps it open, the gesture its own tooltip advertises', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();

    const tab = page.getByRole('tab', { name: 'E-01' });
    await expect(tab).toHaveClass(/italic/);

    await tab.dblclick();
    await expect(tab).not.toHaveClass(/italic/);
  });

  test('a distribution that switches escalation off drops the tooltip that promised it', async ({
    page,
  }) => {
    await useFeatures(page, 'escalate');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();

    const tab = page.getByRole('tab', { name: 'E-01' });
    await expect(tab).toHaveClass(/italic/);
    await expect(tab.locator('lw-tooltip')).toHaveAttribute('text', 'E-01');

    await tab.dblclick();
    await expect(tab).toHaveClass(/italic/);
  });
});
