import { expect, test, type Page } from '@playwright/test';
import { openRpcSandbox, railRight } from './support/helpers';

const SURFACE = 'iframe[src$="/sandbox-rpc/view.html"]';

async function openToolbar(page: Page) {
  await openRpcSandbox(page);
  const surface = page.frameLocator(SURFACE);
  return surface.getByRole('toolbar', { name: 'Sandbox tools' });
}

test.describe('A toolbar inside an isolated surface', () => {
  test('is filled from the page, worded, and runs an entry in the workbench with the surface’s description', async ({
    page,
  }) => {
    const toolbar = await openToolbar(page);

    await expect(toolbar.getByRole('button', { name: 'Star this record' })).toBeVisible();
    await toolbar.getByRole('button', { name: 'Star this record' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Starred frame' })).toBeVisible();
  });

  test('follows the session without a reload', async ({ page }) => {
    const toolbar = await openToolbar(page);
    const secret = toolbar.getByRole('button', { name: 'Admin-only command' });
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });
    await expect(toolbar.getByRole('button', { name: 'Star this record' })).toBeVisible();
    await expect(secret).toHaveCount(0);

    await cycle.click();
    await cycle.click();
    await expect(secret).toBeVisible();

    await cycle.click();
    await expect(secret).toHaveCount(0);
  });

  test('opens a nested menu the surface draws itself, and runs what is chosen there', async ({
    page,
  }) => {
    const toolbar = await openToolbar(page);
    const sources = toolbar.getByRole('button', { name: 'Sources' });
    await expect(sources).toHaveAttribute('aria-haspopup', 'menu');

    await sources.click();
    const surface = page.frameLocator(SURFACE);
    const menu = surface.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAccessibleName('Sources');
    await expect(menu.getByText('Sources', { exact: true })).toBeVisible();
    await expect(sources).toHaveAttribute('aria-expanded', 'true');

    await menu.getByRole('menuitem', { name: 'Import from a source' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Imported' })).toBeVisible();
    await expect(surface.getByRole('menu')).toHaveCount(0);
  });

  test('carries no cell across the boundary', async ({ page }) => {
    const toolbar = await openToolbar(page);

    await expect(toolbar.getByRole('button', { name: 'Star this record' })).toBeVisible();
    await expect(toolbar.getByTestId('filler-count')).toHaveCount(0);
  });

  test('the composition report finds the sandbox slot declared', async ({ page }) => {
    const lines: string[] = [];
    page.on('console', (message) => void lines.push(message.text()));
    await openToolbar(page);
    await expect(page.getByText('Sandbox plugin activated')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => typeof window['loomweaver']?.report))
      .toBe('function');
    lines.length = 0;

    await page.evaluate(() => window['loomweaver'].report());

    await expect.poll(() => lines.join('\n')).toContain('No problems found.');
  });
});
