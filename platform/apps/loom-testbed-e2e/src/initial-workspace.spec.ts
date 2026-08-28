import { expect, test, Page } from '@playwright/test';

const KEY = 'lw.testbed.initial-workspace';

async function declareInitial(page: Page): Promise<void> {
  await page.addInitScript(
    ([key]) => localStorage.setItem(key, 'review'),
    [KEY],
  );
}

test.describe('A distribution can declare the workspace a fresh install opens in', () => {
  test('a first boot lands in the declared workspace and lays out its content', async ({
    page,
  }) => {
    await declareInitial(page);
    await page.goto('/');

    await expect(
      page.getByRole('separator', { name: 'Resize split' }).first(),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeVisible();
  });

  test('the declared content is what is shown, not the surface served at the bare address', async ({
    page,
  }) => {
    await declareInitial(page);
    await page.goto('/');

    await expect(page).toHaveURL(/\/entry\/e-01/);
    await expect(page.locator('main').first()).not.toContainText(
      'Surfaces under test',
    );
  });

  test('the choice is remembered, so switching away survives a restart', async ({
    page,
  }) => {
    await declareInitial(page);
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();

    await page.evaluate(() =>
      localStorage.setItem('lw.shell.active-workspace', 'default'),
    );
    await page.goto('/');

    await expect(page.getByRole('tab', { name: 'E-01' })).toHaveCount(0);
  });

  test('a deep link wins over the declaration: a shared address opens what it names', async ({
    page,
  }) => {
    await declareInitial(page);
    await page.goto('/notes');

    await expect(page).toHaveURL(/\/notes/);
    await expect(
      page.getByRole('separator', { name: 'Resize split' }).first(),
    ).toBeVisible();
  });
});
