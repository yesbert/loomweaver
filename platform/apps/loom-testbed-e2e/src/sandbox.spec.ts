import { expect, test } from '@playwright/test';
import { runCommand } from './support/helpers';

const claimedFrame = 'iframe[src$="/sandbox-rpc/view.html"]';
const unclaimedFrame = 'iframe[src*="/sandbox-rpc/view.html?unclaimed=1"]';

test.describe('Sandbox stage — iframe plugin over Penpal', () => {
  test('the sandboxed plugin reaches the host over RPC (localised startup toast)', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByText('Sandbox plugin activated')).toBeVisible();
  });

  test('opens as a dynamic tab next to an open dashboard tab and mounts the sandboxed surface', async ({
    page,
  }) => {
    await page.goto('/dashboard/export');
    await runCommand(page, 'Sandbox (unclaimed)');

    await expect(page.getByRole('tab', { name: 'Export' })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Sandbox (unclaimed)' }),
    ).toBeVisible();

    const surface = page.frameLocator(unclaimedFrame);
    await expect(
      surface.getByRole('heading', { name: /isolated iframe/ }),
    ).toBeVisible();
  });

  test('the surface sub-tabs are navigable and reflected in the route', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(claimedFrame);

    await surface.getByRole('tab', { name: 'Architecture' }).click();
    await expect(page).toHaveURL(/sandbox-rpc\/architecture/);
    await expect(surface.getByText(/Two Penpal channels/)).toBeVisible();
  });

  test('deep-links straight into a sub-route of the async-registered frame plugin', async ({
    page,
  }) => {
    await page.goto('/sandbox-rpc/architecture');
    await expect(page).toHaveURL(/sandbox-rpc\/architecture/);
    const surface = page.frameLocator(claimedFrame);
    await expect(
      surface.getByRole('tab', { name: 'Architecture', selected: true }),
    ).toBeVisible();
    await expect(surface.getByText(/Two Penpal channels/)).toBeVisible();

    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();
  });

  test('a second sandboxed plugin auto-opens as a tab on visit', async ({
    page,
  }) => {
    await page.goto('/sandbox-static');

    const infoTab = page.getByRole('tab', { name: 'Sandbox (static tab)' });
    await expect(infoTab).toBeVisible();

    const surface = page.frameLocator(
      'iframe[src*="/sandbox-static/view.html"]',
    );
    await expect(
      surface.getByRole('heading', { name: /static, non-closable tab/ }),
    ).toBeVisible();
  });

  test('keeps the surface in sync across a perspective round-trip (iframe reload)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(claimedFrame);
    await surface.getByRole('tab', { name: 'Architecture' }).click();
    await expect(page).toHaveURL(/sandbox-rpc\/architecture/);

    await runCommand(page, 'Home');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    await expect(
      surface.getByRole('tab', { name: 'Architecture', selected: true }),
    ).toBeVisible();

    await surface.getByRole('tab', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/sandbox-rpc\/overview/);
  });

  test('the <lw-tooltip> host custom element works INSIDE the sandboxed iframe (#9)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(claimedFrame);

    await expect(surface.locator('lw-tooltip [role="tooltip"]')).toBeAttached();
  });

  test('opens as a preview tab; the surface promotes it over RPC (#10)', async ({
    page,
  }) => {
    await page.goto('/');
    await runCommand(page, 'Sandbox (unclaimed)');

    const tab = page.getByRole('tab', { name: 'Sandbox (unclaimed)' });
    await expect(tab).toHaveClass(/italic/);

    const surface = page.frameLocator(unclaimedFrame);
    await surface.getByRole('button', { name: 'Keep open' }).click();
    await expect(tab).not.toHaveClass(/italic/);
  });

  test('the plugin draws its OWN context menu inside the iframe', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(claimedFrame);
    await expect(
      surface.getByRole('heading', { name: /isolated iframe/ }),
    ).toBeVisible();

    await surface
      .getByRole('heading', { name: /isolated iframe/ })
      .click({ button: 'right' });
    await expect(surface.getByRole('menu')).toBeVisible();

    await surface
      .getByRole('menuitem', { name: 'Reveal iframe context' })
      .click();
    await expect(surface.getByText(/no host RPC/)).toBeVisible();
    await expect(surface.getByRole('menu')).toHaveCount(0);
  });

  test('switching the app language re-renders the sandboxed surface live (locale push)', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
      .click();
    const surface = page.frameLocator(claimedFrame);
    await expect(
      surface.getByRole('heading', { name: /isolated iframe/ }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Deutsch' }).click();

    await expect(
      surface.getByRole('heading', { name: /isolierten iframe/ }),
    ).toBeVisible();
  });
});
