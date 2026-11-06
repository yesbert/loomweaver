import { expect, Page, test } from '@playwright/test';
import { rail } from './support/helpers';

function stripHolding(page: Page, name: string) {
  return page
    .getByRole('tablist')
    .filter({ has: page.getByRole('tab', { name, exact: true }) });
}

test.describe('A tab strip is walked with the arrow keys', () => {
  test('one stop in the focus order, arrows and Home/End move, Enter chooses', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).dblclick();
    await page.getByRole('button', { name: 'Bravo' }).dblclick();

    const strip = stripHolding(page, 'E-01');
    const tabs = strip.getByRole('tab');
    const first = page.getByRole('tab', { name: 'E-01', exact: true });
    const second = page.getByRole('tab', { name: 'E-02', exact: true });
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(strip.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);

    await second.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(first).toBeFocused();
    await expect(second).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.first()).toBeFocused();

    const before = page.url();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(page).not.toHaveURL(before);

    await page.keyboard.press('Tab');
    await expect(strip.locator(':focus')).toHaveCount(0);
    await page.keyboard.press('Shift+Tab');
    await expect(first).toBeFocused();
  });

  test('closing a tab with Delete leaves the focus on the selected tab of the strip', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).dblclick();
    await page.getByRole('button', { name: 'Bravo' }).dblclick();

    const first = page.getByRole('tab', { name: 'E-01', exact: true });
    const second = page.getByRole('tab', { name: 'E-02', exact: true });
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(second).toHaveAttribute('aria-keyshortcuts', /Delete/);

    await second.focus();
    await page.keyboard.press('Delete');

    await expect(second).toHaveCount(0);
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(first).toBeFocused();
  });

  test('splitting, minimising, restoring and closing a pane from the keyboard keep the focus in the panes', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).first().dblclick();

    const other = page.locator('lw-pane-view:not([data-address-pane])');
    await page
      .locator(
        'lw-address-pane-header lw-pane-toolbar button[aria-label="Split right"]',
      )
      .focus();
    await page.keyboard.press('Enter');
    await expect(
      other.locator('lw-pane-tab-strip [role="tab"][aria-selected="true"]'),
    ).toBeFocused();

    await other.getByTestId('pane-minimize').focus();
    await page.keyboard.press('Enter');
    const strip = page.getByTestId('pane-minimized-strip');
    await expect(strip).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(strip).toHaveCount(0);
    await expect(
      other.locator('lw-pane-tab-strip [role="tab"][aria-selected="true"]'),
    ).toBeFocused();

    await other
      .locator('lw-pane-toolbar button[aria-label="Close pane"]')
      .focus();
    await page.keyboard.press('Enter');
    await expect(other).toHaveCount(0);
    await expect(
      page.locator(
        'lw-address-pane-header lw-pane-tab-strip [role="tab"][aria-selected="true"]',
      ),
    ).toBeFocused();
  });

  test("a container's inner strip is walked on its own", async ({ page }) => {
    await page.goto('/');
    await rail(page).getByRole('button', { name: 'Browse container' }).click();
    await page.getByTestId('container-list-beta').click();
    await page.getByTestId('container-list-gamma').click();

    const landing = page.locator('lw-container-pane-host lw-pane-view').nth(1);
    const beta = landing.getByRole('tab', { name: 'beta' });
    const gamma = landing.getByRole('tab', { name: 'gamma' });
    await expect(gamma).toHaveAttribute('aria-selected', 'true');

    await gamma.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(beta).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(gamma).toBeFocused();
  });
});
