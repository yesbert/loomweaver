import { Page, expect, test } from '@playwright/test';
import {
  expectFreshWindow,
  markWindow,
  rail,
  railRight,
} from './support/helpers';

const left = '#panel-views-primary';

test.describe('Cross-tab live sync', () => {
  test('a theme change in one window follows into the other without a reload', async ({
    context,
  }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/');
    await second.goto('/');

    await markWindow(second);
    await expect(second.locator('html')).not.toHaveClass(/dark/);

    await first.getByRole('button', { name: 'Dark' }).click();

    await expect(second.locator('html')).toHaveClass(/dark/);
    expect(
      await second.evaluate(
        () =>
          (globalThis as unknown as Record<string, unknown>)['__beforeReload'] ===
          true,
      ),
    ).toBe(true);

    await first.getByRole('button', { name: 'Light' }).click();
    await expect(second.locator('html')).not.toHaveClass(/dark/);
  });

  test('a language change in one window follows into the other without a reload', async ({
    context,
  }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/');
    await second.goto('/');

    await markWindow(second);
    await expect(
      second.getByRole('button', { name: 'Language' }),
    ).toContainText('English');

    await first.getByRole('button', { name: 'Language' }).click();
    await first.getByRole('option', { name: 'Deutsch' }).click();

    await expect(second.getByRole('button', { name: 'Sprache' })).toContainText(
      'Deutsch',
    );
    await expect(second.locator('html')).toHaveAttribute('lang', 'de');
    expect(
      await second.evaluate(
        () =>
          (globalThis as unknown as Record<string, unknown>)['__beforeReload'] ===
          true,
      ),
    ).toBe(true);
  });

  test('a producer-theme toggle in one window follows into the other (opt-in plugin sync)', async ({
    context,
  }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/');
    await second.goto('/');

    const brand = (page: Page) =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--lw-brand')
          .trim(),
      );

    await expect.poll(() => brand(second)).not.toBe('#ea580c');

    await rail(first)
      .getByRole('button', { name: 'Toggle the plugin theme' })
      .click();

    await expect.poll(() => brand(second)).toBe('#ea580c');

    await rail(first)
      .getByRole('button', { name: 'Toggle the plugin theme' })
      .click();
    await expect.poll(() => brand(second)).not.toBe('#ea580c');
    expect(await brand(first)).toBe(await brand(second));
  });

  test('view state mirrors live between two windows showing the same view', async ({
    context,
  }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/');
    await second.goto('/');

    await first.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await second.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await expect(second.getByTestId('outline-sort')).toHaveText(
      /outline order/,
    );

    await first.getByTestId('outline-sort').click();

    await expect(first.getByTestId('outline-sort')).toHaveText(/A–Z/);
    await expect(second.getByTestId('outline-sort')).toHaveText(/A–Z/);
  });

  test('layout stays per window — a split in one window leaves the other alone', async ({
    context,
  }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/search');
    await second.goto('/search');

    const panes = (page: Page) => page.locator('lw-pane-view');
    await expect(panes(first)).toHaveCount(0);

    await first
      .locator(
        'lw-content-area lw-pane-toolbar button[aria-label="Split right"]',
      )
      .click();
    await expect(panes(first)).toHaveCount(1);

    await second.waitForTimeout(500);
    await expect(panes(second)).toHaveCount(0);
  });

  test('a user switch in one window reloads the other into the new namespace', async ({
    context,
  }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/');
    await second.goto('/');

    await railRight(first).getByRole('button', { name: 'Switch user' }).click();
    await expect(
      rail(first).getByRole('button', { name: 'Sign out' }),
    ).toBeVisible();
    await expect(
      rail(second).getByRole('button', { name: 'Sign out' }),
    ).toBeVisible();

    await first.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await first.getByTestId('outline-sort').click();
    await expect(first.getByTestId('outline-sort')).toHaveText(/A–Z/);

    await markWindow(second);
    await rail(first)
      .getByRole('button', { name: 'Switch to the second user' })
      .click();

    await expectFreshWindow(second);
    await second.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await expect(second.getByTestId('outline-sort')).toHaveText(
      /outline order/,
    );
  });
});
