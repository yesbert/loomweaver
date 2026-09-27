import { expect, test, Page } from '@playwright/test';

const host = 'lw-container-pane-host';

const ARRIVALS = [
  { name: 'while the app is already drawn', awaited: false },
  { name: 'while the app waits for it', awaited: true },
];

async function signedInFreshWithASessionThatArrivesLate(
  page: Page,
  awaited: boolean,
): Promise<void> {
  await page.addInitScript((awaitedFlag) => {
    localStorage.setItem('testbed.auth.principal', 'ada');
    localStorage.setItem('lw.testbed.session-delay', '1500');
    localStorage.setItem('lw.testbed.session-awaited', String(awaitedFlag));
    localStorage.setItem('lw.testbed.gated-workspace', 'true');
  }, awaited);
}

for (const arrival of ARRIVALS) {
  test.describe(`A gated container opened cold, the session arriving ${arrival.name}`, () => {
    test.beforeEach(({ page }) =>
      signedInFreshWithASessionThatArrivesLate(page, arrival.awaited),
    );

    test('opens on the child its address names', async ({ page }) => {
      await page.goto('/gated/one/design');

      await expect(page.getByTestId('testbed-container-details')).toBeVisible({
        timeout: 10_000,
      });
      await expect(
        page.locator(host).getByRole('tab', { name: 'Design' }),
      ).toBeVisible();
      await expect(page.getByText('View not available')).toHaveCount(0);
      await expect(page).toHaveURL(/\/gated\/one\/design$/);
    });

    test('opens on its first child when the address names it', async ({
      page,
    }) => {
      await page.goto('/gated/one/general');

      await expect(page.getByTestId('testbed-container-canvas')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText('View not available')).toHaveCount(0);
      await expect(page).toHaveURL(/\/gated\/one\/general$/);
    });

    test('opens on its first child at its own address', async ({ page }) => {
      await page.goto('/gated/one');

      await expect(page.getByTestId('testbed-container-canvas')).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText('View not available')).toHaveCount(0);
    });
  });
}
