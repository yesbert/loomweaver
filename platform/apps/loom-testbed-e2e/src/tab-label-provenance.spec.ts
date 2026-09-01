import { Page, expect, test } from '@playwright/test';

const SANDBOX_WORKSPACE = 'lw.shell.pane-trees:testbed.sandbox';

function storedTabs(page: Page): Promise<readonly Record<string, unknown>[]> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return [];
    }
    const found: Record<string, unknown>[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') {
        return;
      }
      const it = node as Record<string, unknown>;
      if (Array.isArray(it['tabs'])) {
        found.push(...(it['tabs'] as Record<string, unknown>[]));
      }
      walk(it['first']);
      walk(it['second']);
      walk(it['tree']);
      for (const value of Object.values(it)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          walk(value);
        }
      }
    };
    walk(JSON.parse(raw));
    return found;
  }, SANDBOX_WORKSPACE);
}

async function sandboxTab(page: Page): Promise<Record<string, unknown>> {
  const tabs = await storedTabs(page);
  const tab = tabs.find((entry) => entry['path'] === 'sandbox-rpc');
  expect(tab, 'the sandbox workspace stores a tab at its declared address').toBeDefined();
  return tab as Record<string, unknown>;
}

test.describe('A label the workbench worked out is not the tab’s own', () => {
  test('a cold deep link, then a restart, leaves the declared tab unlabelled', async ({
    page,
  }) => {
    await page.goto('/sandbox-rpc');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();
    expect(await sandboxTab(page)).not.toHaveProperty('title');

    await page.reload();
    await expect
      .poll(async () => {
        const tabs = await storedTabs(page);
        const found = tabs.find((entry) =>
          String(entry['path']).startsWith('sandbox-rpc'),
        );
        return found === undefined ? 'missing' : (found['title'] ?? 'none');
      })
      .toBe('none');
  });

  test('a tab stored with a borrowed label recovers as the panes load', async ({
    page,
  }) => {
    await page.goto('/sandbox-rpc');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();

    await page.evaluate((key) => {
      const raw = localStorage.getItem(key) ?? '';
      localStorage.setItem(
        key,
        raw.replace(
          '{"path":"sandbox-rpc"',
          '{"path":"sandbox-rpc","title":"testbed.home.title","icon":"testbedHome"',
        ),
      );
    }, SANDBOX_WORKSPACE);
    expect(await sandboxTab(page)).toHaveProperty('title', 'testbed.home.title');

    await page.reload();
    await expect
      .poll(async () => {
        const tabs = await storedTabs(page);
        const found = tabs.find((entry) =>
          String(entry['path']).startsWith('sandbox-rpc'),
        );
        return found === undefined ? 'missing' : (found['title'] ?? 'none');
      })
      .toBe('none');
  });

  test('a profile poisoned below a declared address heals too', async ({
    page,
  }) => {
    await page.addInitScript(
      ([key, tree]) => {
        localStorage.setItem(key, tree);
        localStorage.setItem('lw.shell.active-workspace', 'testbed.sandbox');
      },
      [
        SANDBOX_WORKSPACE,
        JSON.stringify({
          content: {
            tree: {
              kind: 'leaf',
              id: 'main',
              tabs: [
                {
                  path: 'sandbox-rpc/overview',
                  title: 'testbed.home.title',
                  icon: 'testbedHome',
                  closable: false,
                },
              ],
              active: 'sandbox-rpc/overview',
            },
            primary: 'main',
          },
        }),
      ],
    );

    await page.goto('/sandbox-rpc/overview');

    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Home' })).toHaveCount(0);
  });

  test('a refined label on a declared tab is kept, key or not', async ({
    page,
  }) => {
    await page.goto('/sandbox-rpc');
    await expect(
      page.getByRole('tab', { name: 'Sandbox (iframe)' }),
    ).toBeVisible();

    await page.evaluate((key) => {
      const raw = localStorage.getItem(key) ?? '';
      localStorage.setItem(
        key,
        raw.replace(
          '{"path":"sandbox-rpc"',
          '{"path":"sandbox-rpc","title":"Batch 4711","literalTitle":true',
        ),
      );
    }, SANDBOX_WORKSPACE);

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Batch 4711' })).toBeVisible();
    expect(await sandboxTab(page)).toHaveProperty('title', 'Batch 4711');
  });

  test('a label the user opened a tab with still survives a restart', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entry list' }).first().click();
    await expect(page.locator('[data-testid="list-list"]')).toBeVisible();
    await page.getByRole('button', { name: 'Alpha' }).first().dblclick();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
  });
});
