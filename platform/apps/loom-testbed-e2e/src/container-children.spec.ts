import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

const host = 'lw-container-pane-host';

test.describe('A container child carries an address', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await rail(page).getByRole('button', { name: 'Browse container' }).click();
    await expect(page.getByTestId('testbed-ws-list')).toBeVisible();
  });

  test('the pane declared empty says so, then holds what the list opens', async ({
    page,
  }) => {
    const panes = page.locator(`${host} lw-pane-view`);
    await expect(panes).toHaveCount(2);
    await expect(page.getByTestId('pane-awaiting-content')).toContainText(
      'Nothing open yet',
    );

    await page.getByTestId('ws-list-beta').click();

    await expect(page.getByTestId('pane-awaiting-content')).toHaveCount(0);
    await expect(page.getByTestId('ws-item-id')).toHaveText('beta');
    await expect(panes.nth(1).getByRole('tab', { name: 'beta' })).toBeVisible();
    await expect(page.getByTestId('testbed-ws-list')).toBeVisible();
  });

  test('two items open side by side, and reopening one focuses it instead of duplicating', async ({
    page,
  }) => {
    const landing = page.locator(`${host} lw-pane-view`).nth(1);

    await page.getByTestId('ws-list-beta').click();
    await page.getByTestId('ws-list-gamma').click();
    await expect(landing.getByRole('tab')).toHaveCount(2);
    await expect(page.getByTestId('ws-item-id')).toHaveText('gamma');

    await page.getByTestId('ws-list-beta').click();

    await expect(landing.getByRole('tab')).toHaveCount(2);
    await expect(page.getByTestId('ws-item-id')).toHaveText('beta');
  });

  test('what the list opened survives a reload, values and all', async ({
    page,
  }) => {
    await page.getByTestId('ws-list-delta').click();
    await expect(page.getByTestId('ws-item-id')).toHaveText('delta');

    await page.reload();

    await expect(page.getByTestId('ws-item-id')).toHaveText('delta');
    await expect(
      page.locator(`${host} lw-pane-view`).nth(1).getByRole('tab'),
    ).toHaveCount(1);
  });

  test('closing the last item keeps the pane that was declared for them', async ({
    page,
  }) => {
    const landing = page.locator(`${host} lw-pane-view`).nth(1);
    await page.getByTestId('ws-list-beta').click();
    await expect(landing.getByRole('tab')).toHaveCount(1);

    await landing.getByTestId('tab-close').click();

    await expect(page.locator(`${host} lw-pane-view`)).toHaveCount(2);
    await expect(page.getByTestId('pane-awaiting-content')).toBeVisible();
  });
});

test.describe('The address names the focused child', () => {
  test('the address follows what the list opens, and back returns to the one before', async ({
    page,
  }) => {
    await page.goto('/');
    await rail(page).getByRole('button', { name: 'Browse container' }).click();
    await expect(page).toHaveURL(/\/browse\/alpha$/);

    await page.getByTestId('ws-list-beta').click();
    await expect(page).toHaveURL(/\/browse\/alpha\/item\/beta$/);

    await page.getByTestId('ws-list-gamma').click();
    await expect(page).toHaveURL(/\/browse\/alpha\/item\/gamma$/);

    await page.goBack();

    await expect(page).toHaveURL(/\/browse\/alpha\/item\/beta$/);
    await expect(page.getByTestId('ws-item-id')).toHaveText('beta');
  });

  test('a deep link opens the child it names, and a reload keeps it', async ({
    page,
  }) => {
    await page.goto('/browse/alpha/item/delta');

    await expect(page.getByTestId('ws-item-id')).toHaveText('delta');
    await expect(page.getByTestId('testbed-ws-list')).toBeVisible();

    await page.reload();

    await expect(page.getByTestId('ws-item-id')).toHaveText('delta');
    await expect(page).toHaveURL(/\/browse\/alpha\/item\/delta$/);
  });

  test('a pop-out opens children without touching its address', async ({
    page,
  }) => {
    await page.goto('/popout/browse/alpha');
    await expect(page.getByTestId('testbed-ws-list')).toBeVisible();

    await page.getByTestId('ws-list-beta').click();

    await expect(page.getByTestId('ws-item-id')).toHaveText('beta');
    await expect(page).toHaveURL(/\/popout\/browse\/alpha$/);
  });
});
