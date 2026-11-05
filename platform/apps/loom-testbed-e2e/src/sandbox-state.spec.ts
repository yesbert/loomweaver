import { expect, test, type Page } from '@playwright/test';
import { openRpcSandbox } from './support/helpers';

const SURFACE = 'iframe[src*="/sandbox-rpc/view.html"]';
const SANDBOX_STORE = 'lw.plugin-state:sandbox-rpc:scratch';
const HOST_STORE = 'lw.plugin-state:testbed:scratch';

async function openSandbox(page: Page) {
  await openRpcSandbox(page);
  return page.frameLocator(SURFACE);
}

async function stored(page: Page, key: string): Promise<string> {
  return (await page.evaluate((name) => localStorage.getItem(name), key)) ?? '';
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
      .poll(() => stored(page, SANDBOX_STORE))
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
    await expect
      .poll(() => stored(page, SANDBOX_STORE))
      .toContain('sandbox side');

    expect(await stored(page, HOST_STORE)).not.toContain('sandbox side');
    await expect(page.getByTestId('scratch-echo')).toHaveText('');

    await page.getByTestId('scratch-input').fill('trusted side');
    await expect.poll(() => stored(page, HOST_STORE)).toContain('trusted side');
    await expect(page.getByTestId('scratch-echo')).toHaveText('trusted side');

    expect(await stored(page, SANDBOX_STORE)).toContain('sandbox side');
    await expect(surface.getByTestId('sandbox-scratch')).toHaveValue(
      'sandbox side',
    );
  });
});

test.describe('Typing into a sandboxed surface', () => {
  test('keeps every key in the draft while the panel counts its seconds', async ({
    page,
  }) => {
    const surface = await openSandbox(page);
    const draft = surface.getByTestId('sandbox-draft');
    await draft.pressSequentially('abcdef', { delay: 300 });
    await expect(draft).toHaveValue('abcdef');
  });

  test('keeps every key in the shared note while its store answers each one', async ({
    page,
  }) => {
    const surface = await openSandbox(page);
    const note = surface.getByTestId('sandbox-scratch');
    await note.pressSequentially('hello', { delay: 100 });
    await expect(note).toHaveValue('hello');
  });
});
