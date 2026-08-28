import { Page, expect, test } from '@playwright/test';
import { openEntry } from './support/helpers';

const OTHER_PANE = 'lw-content-grid lw-pane-view lw-pane-tab-strip';

function paneTree(page: Page): Promise<string> {
  return page.evaluate(
    () => localStorage.getItem('lw.shell.pane-trees:default') ?? '',
  );
}

function splitRight(page: Page): Promise<void> {
  return page
    .locator('lw-content-area lw-pane-toolbar button[aria-label="Split right"]')
    .click();
}

test.describe('A pane never shows a tab the URL pane hides', () => {
  test('splitting the home screen does not fabricate a dead "Home" tab', async ({
    page,
  }) => {
    await page.goto('/');

    await splitRight(page);
    await expect(page.locator('lw-content-grid lw-pane-view')).toHaveCount(1);

    await expect(page.locator(`${OTHER_PANE} [role="tab"]`)).toHaveCount(0);
  });

  test('a tab open in two panes stays where the user put the address', async ({
    page,
  }) => {
    const urlPane = page.locator('lw-content-area lw-pane-tab-strip [role="tab"]');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await splitRight(page);
    await openEntry(page, 'E-02');
    await expect(urlPane).toHaveCount(2);

    await page.locator(`${OTHER_PANE} [role="tab"][aria-label="E-01"]`).click();

    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(urlPane).toHaveCount(1);
    await expect(page.locator(`${OTHER_PANE} [role="tab"]`)).toHaveCount(2);

    const settled = await paneTree(page);
    await urlPane.click();
    await expect(page).toHaveURL(/entry\/e-01/);
    expect(await paneTree(page)).toBe(settled);
  });

  test('a preview tab left behind in another pane is still promoted by double-click', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await splitRight(page);
    await page.getByRole('button', { name: 'Bravo' }).click();

    const anywhere = page.locator(
      'lw-pane-tab-strip [role="tab"][aria-label="E-02"]',
    );
    await expect(anywhere).toHaveClass(/italic/);

    await page
      .locator(`${OTHER_PANE} [role="tab"][aria-label="E-01"]`)
      .click();
    await expect(
      page.locator(`${OTHER_PANE} [role="tab"][aria-label="E-02"]`),
    ).toHaveClass(/italic/);

    await page
      .locator(`${OTHER_PANE} [role="tab"][aria-label="E-02"]`)
      .dblclick();
    await expect(anywhere).not.toHaveClass(/italic/);
  });
});
