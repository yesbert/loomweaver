import { expect, type FrameLocator, type Page, test } from '@playwright/test';

function surface(page: Page): FrameLocator {
  return page.frameLocator('iframe[src*="/payments/view.html"]');
}

async function openPayments(page: Page): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Activity bar' })
    .getByRole('button', { name: 'Finance' })
    .click();
  await expect(page).toHaveURL(/\/finance\/matching$/);
}

test('the finance module opens a surface the application does not contain', async ({
  page,
}) => {
  await page.goto('/');
  const overviewFigure = await page.getByTestId('insights-out').innerText();

  await openPayments(page);
  const view = surface(page);

  await expect(view.getByRole('heading', { name: 'Payment matching' })).toBeVisible();
  await expect(view.getByTestId('still-open')).toHaveText(overviewFigure);
  await expect(view.getByTestId('open-items').locator('li')).toHaveCount(2);
  await expect(view.locator('[data-item="Q-0007"]')).toContainText(
    'Nordwind Logistik GmbH',
  );
});

test('every match outcome the rule can produce is on screen', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);

  await expect(view.getByTestId('outcome-confirmed')).toBeVisible();
  await expect(view.getByTestId('outcome-flagged')).toBeVisible();
  await expect(view.getByTestId('outcome-unassigned')).toBeVisible();
});

test('confirming a match takes it off what is still open', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  const view = surface(page);
  const stillOpen = view.getByTestId('still-open');

  await expect(stillOpen).toHaveText('€22,758.37');

  await view.locator('[data-line="b-1"] lw-button[data-confirm]').click();

  await expect(stillOpen).toHaveText('€4,494.25');
  await expect(view.locator('[data-item="Q-0007"]')).toContainText('settled');

  await view.locator('[data-line="b-1"] lw-button[data-undo]').click();

  await expect(stillOpen).toHaveText('€22,758.37');
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
  await expect(view.getByTestId('still-open')).toHaveText('€4,494.25');

  const rail = page.getByRole('navigation', { name: 'Activity bar' });
  await rail.getByRole('button', { name: 'Sales' }).click();
  await expect(page).toHaveURL(/\/sales\/customers$/);

  await rail.getByRole('button', { name: 'Finance' }).click();
  await expect(page).toHaveURL(/\/finance\/matching$/);

  await expect(surface(page).getByTestId('still-open')).toHaveText('€4,494.25');
});

test('the plugin is listed under the name the demo gave it', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Activity bar' })
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

  await page.getByRole('button', { name: 'Switch account' }).click();

  const view = surface(page);
  await expect(view.getByTestId('payments-wrong-role')).toContainText('accounting');
  await expect(view.getByTestId('statement')).toHaveCount(0);
});

test('a signed-out visitor is asked to sign in', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  await expect(surface(page).getByTestId('statement')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();

  const view = surface(page);
  await expect(view.getByTestId('payments-sign-in')).toBeVisible();
  await expect(view.getByTestId('statement')).toHaveCount(0);
});

test('revoking the session grant reaches the mounted surface', async ({ page }) => {
  await page.goto('/');
  await openPayments(page);
  await expect(surface(page).getByTestId('statement')).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Activity bar' })
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
    .getByRole('navigation', { name: 'Activity bar' })
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
