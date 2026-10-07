import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openEntry, runCommand } from './support/helpers';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_AA)
    .analyze();
  expect(
    violations,
    JSON.stringify(
      violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      null,
      2,
    ),
  ).toEqual([]);
}

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('initial shell (light)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await scan(page);
  });

  test('initial shell (dark)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await scan(page);
  });

  test('rail with names, at a height that makes it scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 520 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('switch', { name: 'Left activity bar', exact: true })
      .click();
    await page
      .getByRole('dialog', { name: 'Settings' })
      .getByLabel('Close')
      .click();
    await expect(page.getByTestId('rail-label').first()).toBeVisible();
    await scan(page);
  });

  test('settings dialog open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan(page);
  });

  test('a select named by a label of its own', async ({ page }) => {
    await page.goto('/dashboard/export');
    const range = page.getByRole('button', {
      name: 'Range Short',
      exact: true,
    });
    await expect(range).toBeVisible();
    await scan(page);
  });

  test('a confirmation that asks to type, with something typed', async ({
    page,
  }) => {
    await page.goto('/');
    await runCommand(page, 'Reset list');
    const field = page.getByRole('dialog').getByRole('textbox');
    await expect(field).toHaveAccessibleName('Type Reset to confirm.');
    await field.fill('Res');
    await scan(page);
  });

  test('about dialog open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'About' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan(page);
  });

  test('language menu open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Language' }).click();
    await expect(page.getByRole('option', { name: 'Deutsch' })).toBeVisible();
    await scan(page);
  });

  test('reset dialog open (filled danger button + guard error)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reset list' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').fill('nope');
    await scan(page);
  });

  test('command search open', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('command-palette-entry').click();
    await expect(
      page.getByRole('combobox', { name: 'Command palette' }),
    ).toBeVisible();
    await scan(page);
  });

  test('search over open work open', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('quick-open-entry').click();
    await expect(
      page.getByRole('combobox', { name: 'Go to open tab…' }),
    ).toBeVisible();
    await scan(page);
  });

  test('content tab strip with closable tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await expect(page.getByTestId('tab-close')).toBeVisible();
    await scan(page);
  });

  test("a pane header carrying a surface's own actions, with its menu open", async ({
    page,
  }) => {
    await page.goto('/search');
    const more = page.locator('[data-lw-entry="testbed.search.more"]');
    await expect(more).toBeVisible();
    await scan(page);

    await more.click();
    await expect(page.getByRole('menuitem', { name: 'Notes' })).toBeVisible();
    await scan(page);
  });

  test("a pop-out carrying its surface's actions", async ({ page }) => {
    await page.goto('/popout/search');
    await expect(page.getByTestId('popout-actions')).toBeVisible();
    await scan(page);
  });
  test('a toolbar placed in content, once per row', async ({ page }) => {
    await page.goto('/records');
    await expect(
      page.getByRole('toolbar', { name: 'Record tools' }),
    ).toHaveCount(3);
    await scan(page);
  });

  for (const theme of ['Light', 'Dark']) {
    test(`a toolbar entry in every variant, at both sizes (${theme.toLowerCase()})`, async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: theme }).click();
      await page.evaluate(() => {
        const variants = [
          'primary',
          'default',
          'success',
          'danger',
          'warning',
          'info',
          'ghost',
        ];
        const stage = document.createElement('div');
        stage.className = 'bg-surface p-2';
        stage.style.cssText = 'position:fixed;inset:auto 0 0 0;z-index:100';
        for (const size of ['md', 'sm']) {
          const toolbar = document.createElement(
            'lw-toolbar',
          ) as HTMLElement & {
            entries: unknown;
          };
          toolbar.setAttribute('label', `Variants ${size}`);
          toolbar.setAttribute('size', size);
          stage.append(toolbar);
          toolbar.entries = variants.flatMap((variant) => [
            { key: `${variant}-label`, label: variant, variant },
            {
              key: `${variant}-icon`,
              label: `${variant} icon`,
              icon: 'add',
              variant,
            },
          ]);
        }
        document.body.append(stage);
      });
      await expect(
        page.getByRole('toolbar', { name: 'Variants sm' }),
      ).toBeVisible();
      await expect(page.locator('lw-toolbar .lw-btn--warning')).toHaveCount(4);
      await scan(page);
    });
  }

  test('a placed toolbar folded, with its tray open', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/records');
    const toolbar = page
      .getByTestId('record-r-1')
      .getByRole('toolbar', { name: 'Record tools' });
    await toolbar.getByRole('button', { name: 'More' }).click();
    await expect(toolbar.getByRole('group', { name: 'More' })).toBeVisible();
    await scan(page);
  });
});

const LANDMARK_RULES = [
  'landmark-banner-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-complementary-is-top-level',
  'landmark-main-is-top-level',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-no-duplicate-main',
  'landmark-one-main',
  'landmark-unique',
  'region',
];

test.describe('Landmarks over a split workbench', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entry/e-01');
    await expect(page.locator('#lw-main-content textarea')).toBeVisible();
    await page.getByRole('button', { name: 'Split right' }).click();
    await expect(
      page.locator('lw-pane-view:not([data-address-pane]) lw-surface-body'),
    ).toBeVisible();
  });

  test('the landmark rules pass', async ({ page }) => {
    const { violations } = await new AxeBuilder({ page })
      .withRules(LANDMARK_RULES)
      .analyze();
    expect(
      violations,
      JSON.stringify(
        violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((node) => node.target.join(' ')),
        })),
        null,
        2,
      ),
    ).toEqual([]);
  });

  test('one main holds both panes and their strips', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toHaveCount(1);
    await expect(main.locator('lw-pane-view')).toHaveCount(2);
    await expect(
      main.locator('lw-pane-tab-strip [role="tablist"]'),
    ).toHaveCount(2);
  });

  test('each pane body is a tab panel named by its active tab', async ({
    page,
  }) => {
    const panels = page.getByRole('main').getByRole('tabpanel');
    await expect(panels).toHaveCount(2);
    for (const panel of await panels.all()) {
      const tab = page.locator(
        `[role="tab"][id="${await panel.getAttribute('aria-labelledby')}"]`,
      );
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(tab).toHaveAttribute(
        'aria-controls',
        (await panel.getAttribute('id')) ?? '',
      );
    }
  });

  test('the side panels are told apart and hold their strips', async ({
    page,
  }) => {
    const left = page.getByRole('complementary', { name: 'Left panel' });
    await expect(left).toHaveCount(1);
    await expect(left.getByRole('tablist')).toHaveCount(1);
    const panel = left.getByRole('tabpanel');
    await expect(panel).toHaveCount(1);
    await expect(
      left.locator(
        `[role="tab"][id="${await panel.getAttribute('aria-labelledby')}"]`,
      ),
    ).toHaveAttribute('aria-controls', (await panel.getAttribute('id')) ?? '');
    await expect(
      page.getByRole('complementary', { name: 'Right panel' }),
    ).toHaveCount(1);
  });

  test('the bars are one banner and one content-info region', async ({
    page,
  }) => {
    await expect(page.getByRole('banner', { name: 'Top bar' })).toHaveCount(1);
    await expect(
      page.getByRole('contentinfo', { name: 'Status bar' }),
    ).toHaveCount(1);
  });
});
