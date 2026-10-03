import { expect, Locator, Page, test } from '@playwright/test';

function row(page: Page, id: string): Locator {
  return page.getByTestId(`record-${id}`);
}

function toolbarOf(page: Page, id: string): Locator {
  return row(page, id).getByRole('toolbar', { name: 'Record tools' });
}

test.describe('A toolbar a plugin places in its own content', () => {
  test('stands once per row, filled by the owner and by another plugin, each row matched on its own description', async ({
    page,
  }) => {
    await page.goto('/records');

    const note = toolbarOf(page, 'r-1');
    const task = toolbarOf(page, 'r-2');
    await expect(note.getByRole('button', { name: 'Open record' })).toBeVisible();
    await expect(note.getByRole('button', { name: 'Star this record' })).toBeVisible();
    await expect(task.getByRole('button', { name: 'Open record' })).toBeVisible();
    await expect(task.getByRole('button', { name: 'Star this record' })).toHaveCount(0);
    await expect(page.getByRole('toolbar', { name: 'Record tools' })).toHaveCount(3);
  });

  test('runs a contributed entry with the row it stands beside', async ({ page }) => {
    await page.goto('/records');

    await toolbarOf(page, 'r-3').getByRole('button', { name: 'Star this record' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Starred r-3' })).toBeVisible();
  });

  test('opens a nested menu another plugin fills, beside the entry', async ({ page }) => {
    await page.goto('/records');
    const sources = toolbarOf(page, 'r-1').getByRole('button', { name: 'Sources' });
    await expect(sources).toHaveAttribute('aria-haspopup', 'menu');

    await sources.click();

    const menu = page.getByRole('menu', { name: 'Sources' });
    await expect(menu).toBeVisible();
    await expect(sources).toHaveAttribute('aria-expanded', 'true');
    await menu.getByRole('menuitem', { name: 'Import from a source' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Imported' })).toBeVisible();
  });

  test('carries another plugin’s cell, told the row, and the owner’s own word', async ({ page }) => {
    await page.goto('/records');
    const toolbar = toolbarOf(page, 'r-2');

    await expect(toolbar.getByTestId('filler-count')).toHaveText('r-2');
    await expect(toolbar.getByText('a cell the owner placed itself')).toBeVisible();
  });

  test('is one tab stop whose arrow keys walk its entries', async ({ page }) => {
    await page.goto('/records');
    const toolbar = toolbarOf(page, 'r-1');
    const open = toolbar.getByRole('button', { name: 'Open record' });

    await open.focus();
    await page.keyboard.press('ArrowRight');

    await expect(toolbar.getByRole('button', { name: 'Star this record' })).toBeFocused();
    await expect(open).toHaveAttribute('tabindex', '-1');
  });

  test('folds what it cannot show into a control that offers the rest', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/records');
    const toolbar = toolbarOf(page, 'r-1');
    const more = toolbar.getByRole('button', { name: 'More' });

    await expect(more).toBeVisible();
    await more.click();
    await expect(toolbar.getByRole('group', { name: 'More' })).toBeVisible();
  });

  test('the composition report still finds nothing wrong with the testbed', async ({ page }) => {
    const lines: string[] = [];
    page.on('console', (message) => void lines.push(message.text()));
    await page.goto('/records');
    await expect(page.getByText('Sandbox plugin activated')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => typeof window['loomweaver']?.report))
      .toBe('function');
    lines.length = 0;

    await page.evaluate(() => window['loomweaver'].report());

    await expect.poll(() => lines.join('\n')).toContain('No problems found.');
  });
});
