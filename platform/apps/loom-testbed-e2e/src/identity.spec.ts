import { Page, expect, test } from '@playwright/test';
import {
  expectFreshWindow,
  markWindow,
  rail,
  railRight,
} from './support/helpers';

test.describe('Identity-scoped state & identity-change reload', () => {
  const left = '#panel-views-primary';

  const outlineTab = (page: Page) =>
    page.locator(left).getByRole('tab', { name: 'Outline' });

  test('a user switch reloads the app and swaps the settings namespace', async ({
    page,
  }) => {
    await page.goto('/');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });

    await markWindow(page);
    await cycle.click();
    await expect(
      rail(page).getByRole('button', { name: 'Sign out' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          (globalThis as unknown as Record<string, unknown>)['__beforeReload'] ===
          true,
      ),
    ).toBe(true);

    await outlineTab(page).click();
    const sortButton = page.getByTestId('outline-sort');
    await sortButton.click();
    await expect(sortButton).toHaveText(/A–Z/);
    await expect
      .poll(() =>
        page
          .evaluate(() =>
            localStorage.getItem(
              'lw.id.ada:lw.shell.view-state:testbed.outline',
            ),
          )
          .catch(() => null),
      )
      .toContain('alpha');

    await markWindow(page);
    await rail(page)
      .getByRole('button', { name: 'Switch to the second user' })
      .click();
    await expectFreshWindow(page);
    await expect(
      rail(page).getByRole('button', { name: 'Sign out' }),
    ).toBeVisible();

    await outlineTab(page).click();
    await expect(page.getByTestId('outline-sort')).toHaveText(/outline order/);

    await markWindow(page);
    await cycle.click();
    await cycle.click();
    await expectFreshWindow(page);

    await outlineTab(page).click();
    await expect(page.getByTestId('outline-sort')).toHaveText(/A–Z/);
  });
});
