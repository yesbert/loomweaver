import { expect, type FrameLocator, type Page, test } from '@playwright/test';
import { signOut, switchAccount } from './account';
import { areaHeading, navEntry } from './nav-tree';
import { installPaymentMatching } from './plugin-store';
import { tab } from './tabs';

function surface(page: Page): FrameLocator {
  return page.frameLocator('iframe[src*="/payments/view.html"]');
}

async function openPayments(page: Page): Promise<void> {
  await installPaymentMatching(page);
  await page
    .getByRole('navigation', { name: 'Left activity bar' })
    .getByRole('button', { name: 'Finance' })
    .click();
  await areaHeading(page, 'matching').click();
  await navEntry(page, 'finance/matching').click();
  await expect(page).toHaveURL(/\/finance\/matching$/);
}

test('the finance module opens a surface the application does not contain', async ({
  page,
}) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);

  await expect(view.getByRole('heading', { name: 'Payment matching' })).toBeVisible();
  await expect(view.getByTestId('open-items').locator('li')).toHaveCount(4);
  await expect(view.locator('[data-item="RE-2043"]')).toContainText(
    'Nordwind Logistik GmbH',
  );
  const stillOpen = await view.getByTestId('still-open').innerText();

  await navEntry(page, 'finance/receivables').click();
  await expect(page.getByTestId('receivables-open')).toHaveText(stillOpen);
});

test('every match outcome the rule can produce is on screen', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);

  await expect(view.getByTestId('outcome-confirmed')).toHaveCount(3);
  await expect(view.getByTestId('outcome-flagged')).toHaveCount(1);
  await expect(view.getByTestId('outcome-unassigned')).toHaveCount(1);
});

test('confirming a match takes it off what is still open', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);
  const stillOpen = view.getByTestId('still-open');

  await expect(stillOpen).toHaveText('€42,073.27');

  await view.locator('[data-line="b-1"] lw-button[data-confirm]').click();

  await expect(stillOpen).toHaveText('€23,809.15');
  await expect(view.locator('[data-item="RE-2043"]')).toContainText('settled');

  await view.locator('[data-line="b-1"] lw-button[data-undo]').click();

  await expect(stillOpen).toHaveText('€42,073.27');
});

test('the tab says whether anything is still open, and follows the confirmations', async ({
  page,
}) => {
  await page.goto('/');
  await openPayments(page);
  const matchingTab = tab(page, 'finance/matching');
  const view = surface(page);
  await expect(matchingTab).toHaveAttribute('aria-label', 'Payment matching, Open');

  for (const line of ['b-1', 'b-4', 'b-5']) {
    await view.locator(`[data-line="${line}"] lw-button[data-confirm]`).click();
  }
  await expect(matchingTab).toHaveAttribute('aria-label', 'Payment matching, Open');

  await view.locator('[data-line="b-2"] lw-button[data-confirm]').click();
  await expect(matchingTab).toHaveAttribute('aria-label', 'Payment matching, Done');

  await view.locator('[data-line="b-2"] lw-button[data-undo]').click();
  await expect(matchingTab).toHaveAttribute('aria-label', 'Payment matching, Open');
});

test('exact matches are booked on their own once the setting is on, and shown as booked', async ({
  page,
}) => {
  await page.goto('/');
  await installPaymentMatching(page);
  await page
    .getByRole('navigation', { name: 'Left activity bar' })
    .getByRole('button', { name: 'Settings' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Payment matching', exact: true }).click();
  await dialog.getByRole('switch', { name: 'Confirm exact matches automatically' }).click();
  await page.keyboard.press('Escape');

  await openPayments(page);
  const view = surface(page);

  await expect(view.getByTestId('outcome-accepted')).toHaveCount(3);
  await expect(view.getByTestId('outcome-flagged')).toHaveCount(1);
  await expect(view.getByTestId('still-open')).toHaveText('€4,494.25');
});

test('a fetch that fails is reported in the view, not shown as an empty one', async ({
  page,
}) => {
  await page.route('**/api/open-items.json', (route) => route.abort());
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);

  await expect(view.getByTestId('payments-failed')).toBeVisible();
  await expect(view.getByTestId('open-items')).toHaveCount(0);
});

test('confirmations survive leaving the module and coming back', async ({
  page,
}) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);

  await view.locator('[data-line="b-1"] lw-button[data-confirm]').click();
  await expect(view.getByTestId('still-open')).toHaveText('€23,809.15');

  const rail = page.getByRole('navigation', { name: 'Left activity bar' });
  await rail.getByRole('button', { name: 'Sales' }).click();
  await expect(page).toHaveURL(/\/sales\/customers$/);

  await rail.getByRole('button', { name: 'Finance' }).click();
  await expect(page).toHaveURL(/\/finance\/matching$/);

  await expect(surface(page).getByTestId('still-open')).toHaveText('€23,809.15');
});

test('the plugin is listed under the name the demo gave it', async ({ page }) => {
  await page.goto('/');
  await installPaymentMatching(page);
  await page
    .getByRole('navigation', { name: 'Left activity bar' })
    .getByRole('button', { name: 'Settings' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Permissions' }).click();

  await expect(
    dialog.getByRole('heading', { name: 'Payment matching' }),
  ).toBeVisible();
  await expect(dialog.getByTestId('perm-level-payments')).toHaveText(
    /cannot reach this application/i,
  );
});

test('the sales account is told why it cannot match payments', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  await expect(surface(page).getByTestId('statement')).toBeVisible();

  await switchAccount(page);

  const view = surface(page);
  await expect(view.getByTestId('payments-wrong-role')).toContainText('accounting');
  await expect(view.getByTestId('statement')).toHaveCount(0);
});

test('a signed-out visitor is asked to sign in', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  await expect(surface(page).getByTestId('statement')).toBeVisible();

  await signOut(page);

  const view = surface(page);
  await expect(view.getByTestId('payments-sign-in')).toBeVisible();
  await expect(view.getByTestId('statement')).toHaveCount(0);
});

test('revoking the session grant reaches the mounted surface', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  await expect(surface(page).getByTestId('statement')).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Left activity bar' })
    .getByRole('button', { name: 'Settings' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Permissions' }).click();
  await dialog.getByTestId('perm-payments-session').click();

  await expect(surface(page).getByTestId('payments-sign-in')).toBeVisible();
});

test('the colour scheme repaints the surface, and the kit still draws its controls', async ({
  page,
}) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);
  const button = view.locator('[data-line="b-1"] lw-button[data-confirm]');

  await expect(button).toBeVisible();
  const light = await button.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );

  await page
    .getByRole('navigation', { name: 'Left activity bar' })
    .getByRole('button', { name: 'Settings' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Dark' }).click();
  await page.keyboard.press('Escape');

  await expect(view.locator('html')).toHaveClass(/dark/);
  await expect(button).toBeVisible();
  await expect
    .poll(() => button.evaluate((node) => getComputedStyle(node).backgroundColor))
    .not.toBe(light);
});

test.describe('west of UTC', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });

  for (const [when, now] of [
    ['at noon', '2026-03-09T20:00:00Z'],
    ['in the evening, when UTC is a day ahead', '2026-03-10T03:00:00Z'],
  ]) {
    test(`a payment booked yesterday shows yesterday's date ${when}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(now));
      await page.goto('/');
      await openPayments(page);

      await expect(surface(page).locator('[data-line="b-1"] .row-meta')).toContainText(
        '8 Mar 2026',
      );
    });
  }
});

for (const [zone, now, when] of [
  ['America/Los_Angeles', '2026-03-10T03:00:00Z', 'in the evening, when UTC is a day ahead'],
  ['Pacific/Auckland', '2026-03-09T19:00:00Z', 'in the morning, when UTC is a day behind'],
]) {
  test.describe(`in ${zone}`, () => {
    test.use({ timezoneId: zone });

    test(`a line on the edge of the period is in or out by its date ${when}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(now));
      await page.goto('/');
      await openPayments(page);
      const view = surface(page);
      await expect(view.getByTestId('statement')).toBeVisible();

      const shown = await view.locator('body').evaluate(() => {
        const matching = (
          globalThis as unknown as {
            PaymentsMatching: {
              shownStatement(settings: { period: string; sort: string }): { id: string }[];
            };
          }
        ).PaymentsMatching;
        return matching.shownStatement({ period: '5', sort: 'newest' }).map((line) => line.id);
      });

      expect(shown).toEqual(['b-1', 'b-2', 'b-3']);
    });
  });
}
