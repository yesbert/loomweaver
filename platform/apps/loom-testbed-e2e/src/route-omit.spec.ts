import { expect, test } from '@playwright/test';

test.describe('Omitted content route', () => {
  test('a deep-link to an omitted route explains itself instead of falling back to home', async ({
    page,
  }) => {
    await page.goto('/retired');

    await expect(
      page.getByRole('heading', { name: 'View not available' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/retired$/);
  });

  test('an omitted route is gone from the pane target picker', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByTestId('content-new-tab').click();

    await expect(page.getByRole('menuitem', { name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Retired' })).toHaveCount(
      0,
    );
  });

  test('omitting a route leaves the weaver its other surfaces', async ({
    page,
  }) => {
    await page.goto('/notes');

    await expect(page).toHaveURL(/\/notes$/);
    await expect(
      page.getByRole('heading', { name: 'View not available' }),
    ).toHaveCount(0);
  });
});
