import { expect, test } from '@playwright/test';
import damaged from './fixtures/damaged-payments-workspace.json' with { type: 'json' };

function railButton(page: import('@playwright/test').Page, name: string) {
  return page.getByRole('navigation').first().getByRole('button', { name });
}

async function restoreDamagedProfile(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate((stored: Record<string, string>) => {
    localStorage.clear();
    for (const [key, value] of Object.entries(stored)) {
      localStorage.setItem(key, value);
    }
  }, damaged.localStorage);
  await page.goto('/');
  await expect(page.getByTestId('insights-out')).toBeVisible();
}

test('a payments workspace that lost its content is entered rather than swapped for the dashboard', async ({
  page,
}) => {
  await restoreDamagedProfile(page);

  await railButton(page, 'Zahlungen').click();

  await expect(page.getByTestId('workspace-unusable-notice')).toBeVisible();
  await expect(
    await page.evaluate(() => localStorage.getItem('lw.shell.active-workspace')),
  ).toBe('payments');
});

test('resetting from that notice brings the payments surface back', async ({
  page,
}) => {
  await restoreDamagedProfile(page);
  await railButton(page, 'Zahlungen').click();

  await page.getByTestId('workspace-unusable-reset').click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByTestId('workspace-unusable-notice')).toBeHidden();
  await expect(
    await page.evaluate(() =>
      localStorage.getItem('lw.shell.pane-trees:payments'),
    ),
  ).toContain('"payments"');

  await page.reload();

  await expect(
    page.frameLocator('iframe[src*="/payments/view.html"]').getByTestId('open-items'),
  ).toBeVisible();
});

test('the quotes arrangement the profile carried is left alone', async ({
  page,
}) => {
  await restoreDamagedProfile(page);

  await railButton(page, 'Angebote').click();

  await expect(page.getByRole('tab', { name: 'Q-0005' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Q-0007' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Q-0006' })).toBeVisible();
});
