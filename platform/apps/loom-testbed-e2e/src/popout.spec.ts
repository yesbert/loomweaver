import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

const left = '#panel-views-primary';

test.describe('Pop-out windows', () => {
  test('a view pop-out shows only the view — no rail, no sidebar, titled window', async ({
    page,
  }) => {
    await page.goto('/popout/view/testbed.outline');

    await expect(page.getByTestId('popout-surface')).toBeVisible();
    await expect(page.getByTestId('outline-sort')).toBeVisible();
    await expect(rail(page)).toHaveCount(0);
    await expect(page.locator(left)).toHaveCount(0);
    await expect(page).toHaveTitle(/^Outline — /);
  });

  test('a routable pop-out renders that surface bare', async ({ page }) => {
    await page.goto('/popout/search');

    await expect(page.getByTestId('popout-surface')).toBeVisible();
    await expect(rail(page)).toHaveCount(0);
    await expect(page).toHaveTitle(/^Search — /);
  });

  test('a gated route in a pop-out shows the access placeholder and does not redirect', async ({
    page,
  }) => {
    await page.goto('/popout/secret');

    await expect(rail(page)).toHaveCount(0);
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await expect(page).toHaveURL(/\/popout\/secret$/);
    await expect(page.getByTestId('access-placeholder')).toContainText(
      'Sign-in required',
    );
  });

  test('a pop-out never writes layout keys', async ({ page }) => {
    await page.goto('/popout/view/testbed.outline');
    await expect(page.getByTestId('popout-surface')).toBeVisible();
    await page.getByTestId('outline-sort').click();
    await expect(page.getByTestId('outline-sort')).toHaveText(/A–Z/);

    await page.waitForTimeout(500);
    await expect(
      page.evaluate(() => localStorage.getItem('lw.shell.pane-trees:default')),
    ).resolves.toBeNull();
  });

  test('the view context menu opens the view in its own window, keeping the original', async ({
    context,
  }) => {
    const page = await context.newPage();
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    const popup = context.waitForEvent('page');
    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Open in new window' }).click();

    const opened = await popup;
    await opened.waitForLoadState();
    expect(new URL(opened.url()).pathname).toBe('/popout/view/testbed.outline');
    await expect(opened.getByTestId('popout-surface')).toBeVisible();

    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
  });

  test('a doc pop-out switches its sub-tab locally, keeping the URL in the /popout/ prefix', async ({
    page,
  }) => {
    await page.goto('/popout/entry/e-01');
    await expect(page.getByTestId('popout-surface')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();

    await page.getByRole('tab', { name: 'Fields' }).click();

    await expect(page.getByTestId('entry-meta')).toBeVisible();
    await expect(page).toHaveURL(/\/popout\/entry\/e-01$/);
  });

  test('view state mirrors live between the main window and its pop-out', async ({
    context,
  }) => {
    const main = await context.newPage();
    await main.goto('/');
    await main.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await expect(main.getByTestId('outline-sort')).toHaveText(/outline order/);

    const popout = await context.newPage();
    await popout.goto('/popout/view/testbed.outline');
    await expect(popout.getByTestId('popout-surface')).toBeVisible();

    await popout.getByTestId('outline-sort').click();

    await expect(popout.getByTestId('outline-sort')).toHaveText(/A–Z/);
    await expect(main.getByTestId('outline-sort')).toHaveText(/A–Z/);
  });
});

test.describe('A pop-out offers only what can work there', () => {
  test('has no quick-open, since it has no tab strip', async ({ page }) => {
    await page.goto('/popout/search');
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);

    await page.keyboard.press('Meta+p');
    await page.keyboard.press('Control+p');

    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('offers only the commands that declare popout, and nothing else', async ({
    page,
  }) => {
    await page.goto('/popout/search');
    await page.keyboard.press('Meta+k');
    await page.keyboard.press('Control+k');
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible();

    for (const name of ['Settings', 'About', 'Toggle the plugin theme']) {
      await expect(options.filter({ hasText: name }).first()).toBeVisible();
    }
    await expect(options.filter({ hasText: 'Notes' })).toHaveCount(0);
    await expect(options.filter({ hasText: 'Sign out' })).toHaveCount(0);
    await expect(
      options.filter({ hasText: 'Focus the entry list' }),
    ).toHaveCount(0);
  });
});
