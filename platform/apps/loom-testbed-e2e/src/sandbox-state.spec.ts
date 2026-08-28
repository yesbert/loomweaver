import { expect, test } from '@playwright/test';

const SURFACE = 'iframe[src*="/sandbox-rpc/view.html"]';

async function openSandbox(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Sandbox (iframe)', exact: true })
    .click();
  return page.frameLocator(SURFACE);
}

test.describe('A sandboxed surface reaches its plugin store', () => {
  test('what it writes survives a reload, over the RPC seam', async ({
    page,
  }) => {
    const surface = await openSandbox(page);
    await surface
      .getByTestId('sandbox-scratch')
      .fill('written from the iframe');

    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('lw.plugin-state:sandbox-rpc:scratch'),
        ),
      )
      .toContain('written from the iframe');

    await page.reload();
    const reopened = page.frameLocator(SURFACE);
    await expect(reopened.getByTestId('sandbox-scratch')).toHaveValue(
      'written from the iframe',
    );
  });

  test('its store is its own — the host plugin sharing the same key name is untouched', async ({
    page,
  }) => {
    const surface = await openSandbox(page);
    await surface.getByTestId('sandbox-scratch').fill('sandbox side');

    await expect(page.getByTestId('scratch-echo')).toHaveText('');
    await page.getByTestId('scratch-input').fill('trusted side');
    await expect(surface.getByTestId('sandbox-scratch')).toHaveValue(
      'sandbox side',
    );
  });
});
