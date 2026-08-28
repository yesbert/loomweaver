import { expect, test } from '@playwright/test';
import { openEntry, railRight } from './support/helpers';

test.describe('Content split', () => {
  test('splits the focused view into a second pane, resizes, persists, and closes', async ({
    page,
  }) => {
    await page.goto('/search');

    const toggle = page.locator(
      'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
    );
    await expect(toggle).toBeVisible();

    await toggle.click();
    const divider = page.getByRole('separator', { name: 'Resize split' });
    await expect(divider).toBeVisible();
    await expect(page.locator('lw-content-secondary-pane')).toBeVisible();

    await divider.focus();
    await page.keyboard.press('ArrowRight');

    await page.reload();
    await expect(
      page.getByRole('separator', { name: 'Resize split' }),
    ).toBeVisible();
    await expect(page.locator('lw-content-secondary-pane')).toBeVisible();

    await page.getByRole('button', { name: 'Close pane' }).first().click();
    await expect(
      page.getByRole('separator', { name: 'Resize split' }),
    ).toHaveCount(0);
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);
  });

  test('the split toolbar works on an access-gated surface once the session qualifies (finding #32)', async ({
    page,
  }) => {
    const toggle = page.locator(
      'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
    );
    await page.goto('/secret');
    await expect(page.getByText('Sign-in required')).toBeVisible();
    await expect(toggle).toHaveCount(0);

    await page.goto('/search');
    const cycle = railRight(page).getByRole('button', {
      name: 'Switch user',
    });
    await cycle.click();
    await cycle.click();

    await page.goto('/secret');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(
      page.getByRole('separator', { name: 'Resize split' }),
    ).toBeVisible();
    await expect(page.locator('lw-content-secondary-pane')).toBeVisible();
  });

  test('an empty content area offers New tab in the floating toolbar next to the split controls', async ({
    page,
  }) => {
    await page.goto('/');

    const newTab = page.getByTestId('content-new-tab');
    await expect(newTab).toBeVisible();
    await expect(page.getByTestId('content-split-toggle')).toBeVisible();

    await newTab.click();
    await page.getByRole('menuitem', { name: 'Notes' }).click();
    await expect(page).toHaveURL(/\/notes$/);
  });

  test('closing the URL pane’s last tab in a split dissolves it and the neighbour takes over (R2)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await openEntry(page, 'E-02');

    await page.getByRole('tab', { name: 'E-01' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Split right' }).click();
    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(page).toHaveURL(/entry\/e-01/);

    await page
      .locator('lw-content-area')
      .getByTestId('tab-close')
      .first()
      .click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(0);
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(0);
    await expect(page).toHaveURL(/entry\/e-02/);
  });

  test('the toolbar split duplicates the active tab into a new pane, keeping its name — the tab stays where it is', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).first().dblclick();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .first()
      .dblclick();
    await expect(page).toHaveURL(/entry\/e-02/);

    const inlineSplit = page.locator(
      'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
    );
    await expect(inlineSplit).toBeVisible();
    await inlineSplit.click();

    await expect(
      page.locator('lw-content-grid lw-pane-split-handle'),
    ).toHaveCount(1);
    await expect(
      page.locator('lw-content-area').getByRole('tab', { name: 'E-02' }),
    ).toHaveCount(1);
    await expect(page.locator('lw-pane-view')).toHaveCount(1);
    await expect(page).toHaveURL(/entry\/e-02/);

    const copy = page.locator('lw-pane-view');
    await expect(copy.getByRole('tab', { name: 'E-02' })).toHaveCount(1);
    await expect(copy.getByRole('tab', { name: 'Entry editor' })).toHaveCount(
      0,
    );
  });
});
