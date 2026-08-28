import { expect, test, Page } from '@playwright/test';

const KEY = 'lw.testbed.claimed-entries';

async function letReviewClaimEntries(page: Page): Promise<void> {
  await page.addInitScript(
    ([key]) => localStorage.setItem(key, 'review'),
    [KEY],
  );
}

async function openBravoFromTheList(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open the entry list' }).click();
  await page.getByRole('button', { name: /^Bravo/ }).first().dblclick();
}

test.describe('A workspace claims the content that belongs to it', () => {
  test('reaching a claimed address moves the workbench into the workspace that claims it', async ({
    page,
  }) => {
    await letReviewClaimEntries(page);
    await page.goto('/entry/e-02');

    await expect(page).toHaveURL(/\/entry\/e-02/);
    await expect(page.getByRole('tab', { name: 'Search' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
  });

  test('opening an entry from the list moves too, not only a typed address', async ({
    page,
  }) => {
    await letReviewClaimEntries(page);
    await page.goto('/');
    await openBravoFromTheList(page);

    await expect(page.getByRole('tab', { name: 'Search' })).toBeVisible();
  });

  test('a distribution that claims nothing stays where it is', async ({
    page,
  }) => {
    await page.goto('/entry/e-02');

    await expect(page).toHaveURL(/\/entry\/e-02/);
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Notes' })).toHaveCount(0);
  });
});
