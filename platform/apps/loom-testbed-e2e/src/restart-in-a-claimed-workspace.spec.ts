import { expect, test, Page } from '@playwright/test';

const ARRIVALS = [
  { name: 'while the app is already drawn', awaited: false },
  { name: 'while the app waits for it', awaited: true },
];

const ADDRESSES = ['/gated', '/gated/one/general'];

async function signedInFreshWithASessionThatArrivesLate(
  page: Page,
  awaited: boolean,
): Promise<void> {
  await page.addInitScript((awaitedFlag) => {
    localStorage.setItem('lw.testbed.initial-workspace', 'review');
    localStorage.setItem('lw.testbed.gated-workspace', 'true');
    localStorage.setItem('testbed.auth.principal', 'ada');
    localStorage.setItem('lw.testbed.session-delay', '600');
    localStorage.setItem('lw.testbed.session-awaited', String(awaitedFlag));
  }, awaited);
}

function railItem(page: Page, workspace: string) {
  return page.locator(`[data-rail-item="testbed.workspace.${workspace}"]`);
}

for (const arrival of ARRIVALS) {
  for (const address of ADDRESSES) {
    test(`a restart at gated ${address}, the session arriving ${arrival.name}, leaves the initial workspace as it was`, async ({
      page,
    }) => {
      await signedInFreshWithASessionThatArrivesLate(page, arrival.awaited);
      await page.goto(address);
      await expect(railItem(page, 'gated')).toHaveAttribute(
        'aria-current',
        'true',
        { timeout: 10_000 },
      );

      await page.reload();
      await expect(railItem(page, 'gated')).toHaveAttribute(
        'aria-current',
        'true',
        { timeout: 10_000 },
      );
      await railItem(page, 'review').click();

      await expect(page).toHaveURL(/\/entry\/e-01$/);
      await expect(
        page.getByRole('main').getByRole('tab', { name: 'Gated container' }),
      ).toHaveCount(0);
    });
  }
}
