import { expect, test } from '@playwright/test';
import { runCommand, useFeatures } from './support/helpers';

test.describe('Content area', () => {
  test('lands on the home route', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Surfaces under test' }),
    ).toBeVisible();
  });

  test('visiting a dashboard route auto-opens its tab, navigable by URL', async ({
    page,
  }) => {
    await page.goto('/');
    await page.goto('/dashboard/overview');
    await expect(page).toHaveURL(/dashboard\/overview/);
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

    await page.goto('/dashboard/trends');
    await expect(page.getByRole('tab', { name: 'Trends' })).toBeVisible();

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/dashboard\/overview/);
    await expect(page.getByRole('tab', { name: 'Trends' })).toBeVisible();
  });

  test('opens document tabs and preserves edits across a perspective switch', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page).toHaveURL(/entry\/e-01/);

    await page.locator('#lw-main-content textarea').fill('EDITED-XYZ');

    await runCommand(page, 'Search');
    await expect(page).toHaveURL(/\/search$/);
    const entryTab = page.getByRole('tab', { name: 'E-01' });
    await expect(entryTab).toBeVisible();

    await entryTab.click();
    await expect(page.locator('#lw-main-content textarea')).toHaveValue(
      'EDITED-XYZ',
    );
  });

  test('one strip holds every open tab: an entry tab sits beside the dashboard tabs', async ({
    page,
  }) => {
    const strip = page.locator('lw-content-area');
    await page.goto('/dashboard/overview');
    await expect(strip.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page).toHaveURL(/entry\/e-01/);

    await expect(strip.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(strip.getByRole('tab', { name: 'Overview' })).toBeVisible();

    await strip.getByRole('tab', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/dashboard\/overview/);
    await expect(strip.getByRole('tab', { name: 'E-01' })).toBeVisible();
  });

  test('nested Thread/Fields sub-tabs are reflected in the route', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();

    await expect(page).toHaveURL(/entry\/e-01$/);
    await expect(page.locator('#lw-main-content textarea')).toBeVisible();

    await page.getByRole('tab', { name: 'Fields' }).click();
    await expect(page).toHaveURL(/entry\/e-01\/meta/);
    await expect(page.locator('#lw-main-content textarea')).toHaveCount(0);
    await expect(page.getByTestId('entry-meta')).toBeVisible();

    await page.getByRole('tab', { name: 'Thread' }).click();
    await expect(page).toHaveURL(/entry\/e-01\/detail/);
    await expect(page.locator('#lw-main-content textarea')).toBeVisible();
  });

  test('a sub-route may carry a value, and it is a shareable deep link', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page.getByRole('button', { name: 'Alpha' }).click();

    await page.getByTestId('entry-message-2').click();
    await expect(page).toHaveURL(/entry\/e-01\/message\/2/);
    await expect(page.getByTestId('entry-message-open')).toHaveCount(1);

    await page.goto('/entry/e-01/message/2');
    await expect(page.getByTestId('entry-message-open')).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
  });

  test('a nested sub-route is a shareable deep link (restored on load)', async ({
    page,
  }) => {
    await page.goto('/entry/e-02/meta');
    await expect(page).toHaveURL(/entry\/e-02\/meta/);
    await expect(page.getByTestId('entry-meta')).toBeVisible();
    await expect(page.locator('#lw-main-content textarea')).toHaveCount(0);

    await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();
  });

  test('closes a dynamic document tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .click();
    await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();

    await page.getByTestId('tab-close').click();
    await expect(page.getByRole('tab', { name: 'E-02' })).toHaveCount(0);
  });

  test('Delete on the focused tab closes it (keyboard equivalent of the × affordance)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .click();
    const tab = page.getByRole('tab', { name: 'E-02' });
    await expect(tab).toBeVisible();

    await tab.focus();
    await page.keyboard.press('Delete');
    await expect(tab).toHaveCount(0);
  });

  test('marks the open entry in the list and clears it when the tab closes (#11)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();
    await expect(page.locator('[data-open]')).toHaveCount(0);

    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .click();
    await expect(page.getByRole('tab', { name: 'E-02' })).toBeVisible();
    await expect(page.locator('[data-open]')).toHaveCount(1);

    await page.getByTestId('tab-close').click();
    await expect(page.getByRole('tab', { name: 'E-02' })).toHaveCount(0);
    await expect(page.locator('[data-open]')).toHaveCount(0);
  });

  test('single-click opens a reused italic preview tab; double-click promotes it (#10)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    await page.getByRole('button', { name: 'Alpha' }).click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveClass(/italic/);

    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .click();
    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'E-02' })).toHaveClass(/italic/);
    await expect(page.getByTestId('tab-close')).toHaveCount(1);

    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .dblclick();
    await expect(page.getByRole('tab', { name: 'E-02' })).not.toHaveClass(
      /italic/,
    );
  });

  test('double-click walks a permanent tab through pin and back', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    await page.getByRole('button', { name: 'Alpha' }).dblclick();
    await page
      .getByRole('button', {
        name: 'Bravo',
      })
      .dblclick();
    await expect(page.getByTestId('tab-unpin')).toHaveCount(0);

    await page.getByRole('tab', { name: 'E-02' }).dblclick();
    await expect(page.getByTestId('tab-unpin')).toBeVisible();

    const pinned = await page.getByRole('tab', { name: 'E-02' }).boundingBox();
    const normal = await page.getByRole('tab', { name: 'E-01' }).boundingBox();
    expect(pinned?.x).toBeLessThan(normal?.x ?? 0);

    await page.getByRole('tab', { name: 'E-02' }).dblclick();
    await expect(page.getByTestId('tab-unpin')).toHaveCount(0);
  });

  test('overflowing tabs shrink, then a chevron opens a dropdown of every open tab (VS-Code style)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    for (const name of [
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo',
      'Foxtrot',
      'Golf',
      'Hotel',
    ]) {
      await page.getByRole('button', { name }).first().dblclick();
    }

    const chevron = page.getByRole('button', { name: 'All open tabs' });
    await expect(chevron).toBeVisible();

    await chevron.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'E-01' })).toBeVisible();
    await expect(menu.getByRole('menuitemcheckbox')).toHaveCount(1);

    await menu.getByRole('menuitem', { name: 'E-01' }).click();
    await expect(page).toHaveURL(/entry\/e-01/);
    const mainTab = page.getByRole('tab', { name: 'E-01' });
    await expect(mainTab).toHaveAttribute('aria-selected', 'true');
    await expect(mainTab).toBeInViewport();
  });

  test.describe('in a narrow window', () => {
    test.use({ viewport: { width: 1100, height: 800 } });

    test('reopening a scrolled-off file brings its tab back into view', async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: 'Entry list' }).click();

      await page.getByRole('button', { name: 'Alpha' }).first().dblclick();
      for (const name of [
        'Bravo',
        'Charlie',
        'Delta',
        'Echo',
        'Foxtrot',
        'Golf',
        'Hotel',
      ]) {
        await page.getByRole('button', { name }).first().dblclick();
      }
      const mainTab = page.getByRole('tab', { name: 'E-01' });
      await expect(mainTab).not.toBeInViewport();

      await page.getByRole('button', { name: 'Alpha' }).first().dblclick();
      await expect(mainTab).toHaveAttribute('aria-selected', 'true');
      await expect(mainTab).toBeInViewport();
    });
  });

  test('a weaver body consumes the <lw-tooltip> host custom element by tag (#9)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    const bubbles = page.locator('lw-tooltip [role="tooltip"]');
    await expect(bubbles.first()).toBeAttached();
    await expect(bubbles.filter({ hasText: 'Alpha' }).first()).toBeAttached();
  });

  test('the rail entry for the home workspace lands on the home route', async ({
    page,
  }) => {
    await page.goto('/');
    await page.goto('/dashboard/overview');
    await expect(page).toHaveURL(/dashboard/);

    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Surfaces under test' }),
    ).toBeVisible();
  });
});
