import { expect, test } from '@playwright/test';

test('a first visit lands on the dashboard, shown as a full screen', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
  await expect(page.locator('[id^="pane-strip:content"]')).toHaveCount(0);
});

test('the overview holds no quote list, so a click cannot bury it', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('[data-testid="quotes-list"] li')).toHaveCount(0);

  await page
    .getByRole('navigation', { name: 'Activity bar' })
    .getByRole('button', { name: 'Quotes' })
    .click();

  await expect(page.locator('[data-testid="quotes-list"] li')).toHaveCount(7);
});

test('the cards carry the figures the data yields', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('insights-out')).toHaveText('€22,758.37');
  await expect(page.getByTestId('insights-rate')).toHaveText('67%');
  await expect(page.getByTestId('insights-margin-total')).toHaveText(
    '€7,821.20',
  );
});

test('both charts are drawn, and a change of colour scheme redraws them', async ({
  page,
}) => {
  await page.goto('/');

  const charts = page.locator('lw-insights-chart canvas');
  await expect(charts).toHaveCount(2);

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await expect(charts).toHaveCount(2);
  await expect(page.getByTestId('insights-pipeline')).toContainText('Accepted');
});

test('the sales account meets the dashboard without the margin card', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('insights-won-margin')).toBeVisible();

  await page.getByRole('button', { name: 'Switch account' }).click();

  await expect(page.getByTestId('insights-won-margin')).toHaveCount(0);
  await expect(page.getByTestId('insights-out')).toBeVisible();
  await expect(page.getByTestId('insights-quoted')).toBeVisible();
});

test('the overview is a workspace of its own, so switching marks it and leaves quotes', async ({
  page,
}) => {
  const rail = page.getByRole('navigation', { name: 'Activity bar' });
  const overview = rail.getByRole('button', { name: 'Overview' });
  const quotes = rail.getByRole('button', { name: 'Quotes' });
  await page.goto('/');

  await expect(overview).toHaveAttribute('aria-current', 'true');

  await quotes.click();
  await expect(page).toHaveURL(/\/quotes\/q-0005$/);
  await expect(quotes).toHaveAttribute('aria-current', 'true');
  await expect(overview).not.toHaveAttribute('aria-current', 'true');

  await overview.click();
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
  await expect(overview).toHaveAttribute('aria-current', 'true');
  await expect(quotes).not.toHaveAttribute('aria-current', 'true');
});

test('moving between them leaves neither workspace counting as changed', async ({
  page,
}) => {
  const rail = page.getByRole('navigation', { name: 'Activity bar' });
  await page.goto('/');

  await rail.getByRole('button', { name: 'Quotes' }).click();
  await expect(page).toHaveURL(/\/quotes\/q-0005$/);
  await rail.getByRole('button', { name: 'Overview' }).click();
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();

  await page.getByRole('button', { name: 'Workspaces' }).click();
  await expect(page.getByTestId('workspace-reset')).toBeDisabled();
});

test('the workbench reports nothing about the declarations', async ({
  page,
}) => {
  const complaints: string[] = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      complaints.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();

  expect(complaints.filter((text) => /workspace|surface/i.test(text))).toEqual(
    [],
  );
});
