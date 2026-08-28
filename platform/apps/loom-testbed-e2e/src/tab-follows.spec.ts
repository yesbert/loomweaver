import { expect, test } from '@playwright/test';

test.describe('Following tabs — facets of one selection (§8)', () => {
  test('a sibling tab points at the owner you are on, and switching owner moves it', async ({
    page,
  }) => {
    await page.goto('/owner/U1/queue');

    await expect(page.getByTestId('owner-id')).toHaveText('U1');
    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/owner\/U1\/profile/);
    await expect(page.getByTestId('owner-id')).toHaveText('U1');

    await page.goto('/owner/U2/profile');
    await page.getByRole('tab', { name: 'Queue' }).click();
    await expect(page).toHaveURL(/owner\/U2\/queue/);
    await expect(page.getByTestId('owner-id')).toHaveText('U2');
  });

  test('an open tab that did not opt in keeps its own address', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');
    await page.goto('/owner/U1/queue');

    await page.getByRole('tab', { name: 'Overview' }).click();

    await expect(page).toHaveURL(/dashboard\/overview$/);
  });

  test('a following tab is not drawn while it has nowhere to point', async ({
    page,
  }) => {
    await page.goto('/dashboard/overview');

    await expect(page.getByRole('tab', { name: 'Profile' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

    await page.goto('/owner/U1/queue');
    await expect(page.getByRole('tab', { name: 'Profile' })).toBeVisible();
  });

  test('a copy split into another pane freezes on the address it had (§8)', async ({
    page,
  }) => {
    await page.goto('/owner/U1/profile');
    await page.getByRole('button', { name: 'Split right' }).click();
    await expect(page.getByTestId('owner-id')).toHaveCount(2);

    await page.goto('/owner/U2/profile');

    await expect(page.getByTestId('owner-id').first()).toHaveText('U2');
    await expect(page.getByTestId('owner-id').last()).toHaveText('U1');
  });
});
