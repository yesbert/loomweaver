import { expect, test, type Page } from '@playwright/test';

/* Every assertion here is about what the workbench did — where it navigated, which look is active,
   whether the command ran — rather than about what the panel drew. The panel is how a visitor asks;
   it is not the claim. */

function prompt(page: Page, id: string) {
  return page.locator(`[data-beat="${id}"]`);
}

async function ask(page: Page, id: string): Promise<void> {
  const button = prompt(page, id);
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toBeEnabled({ timeout: 30_000 });
}

function conversation(page: Page) {
  return page.getByTestId('agent-conversation');
}

test('the panel says the agent is scripted before it says anything else', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('agent-disclosure')).toContainText(
    'No model, no key, no network',
  );
});

test('opening a quote moves the content area to that document and keeps it', async ({
  page,
}) => {
  await page.goto('/');
  await ask(page, 'openQuote');

  await expect(page).toHaveURL(/\/sales\/quotes\/q-0007$/);
  await expect(page.getByRole('tab', { name: 'Q-0007' })).toBeVisible();
});

/* A quote belongs to the sales module, so opening one from the overview takes the visitor there
   rather than laying the document over a dashboard built to hold none. The agent is only one way
   in; a plain link has to land in the same place, which is the point of the claim. */
test('opening a quote from the overview lands in the module quotes belong to', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();

  await ask(page, 'openQuote');

  await expect(page.getByRole('tab', { name: 'Q-0007' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sales' }).first()).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(page.locator('[data-nav-view="sales/quotes"]')).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('a shared link to a quote lands there too, with no agent involved', async ({
  page,
}) => {
  await page.goto('/sales/quotes/q-0007');

  await expect(page.getByRole('button', { name: 'Sales' }).first()).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'Q-0007' })).toBeVisible();
});

test('the overview beat brings the visitor back to the overview workspace', async ({
  page,
}) => {
  await page.goto('/sales/quotes/q-0007');
  await expect(page.getByRole('tab', { name: 'Q-0007' })).toBeVisible();

  await ask(page, 'overview');

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('button', { name: 'Overview' }).first(),
  ).toHaveAttribute('aria-current', 'true');
});

test('the overview takes the whole content area, with no tab and no reload', async ({
  page,
}) => {
  await page.goto('/');
  await ask(page, 'openQuote');
  await page.evaluate(() => ((window as unknown as Record<string, unknown>)['stayed'] = true));

  await ask(page, 'overview');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('insights-dashboard')).toBeVisible();
  await expect(page.locator('[id^="pane-strip:content"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as Record<string, unknown>)['stayed']),
  ).toBe(true);
});

test('declining the confirmation leaves the quote where it was', async ({
  page,
}) => {
  await page.goto('/');
  await prompt(page, 'sendQuote').click();

  await expect(page.getByRole('dialog')).toContainText('Send this quote?');
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(prompt(page, 'sendQuote')).toBeEnabled({ timeout: 30_000 });

  await expect(conversation(page)).toContainText('it never ran');

  await page.getByRole('button', { name: 'Sales' }).first().click();
  await page.locator('[data-nav-view="sales/quotes"]').click();
  await expect(
    page.locator('[data-quote="Q-0004"]'),
  ).toContainText('Draft');
});

test('the margin is answered for the account that may see it, and refused for the one that may not', async ({
  page,
}) => {
  await page.goto('/');
  await ask(page, 'margin');

  await expect(conversation(page)).toContainText('"margin":');

  await page.getByRole('button', { name: 'Switch account' }).click();
  await ask(page, 'margin');

  await expect(conversation(page)).toContainText('Switch accounts and ask me again');
  await expect(conversation(page)).toContainText('is not among them');
});

test('the conversation survives the panel being rebuilt in another workspace', async ({
  page,
}) => {
  await page.goto('/');
  await ask(page, 'openQuote');
  const spoken = await conversation(page).textContent();

  await page.getByRole('button', { name: 'Finance' }).first().click();
  await page.getByRole('button', { name: 'Sales' }).first().click();

  await expect(conversation(page)).toHaveText(spoken ?? '');
});

test('nothing the agent does reaches off the page', async ({ page }) => {
  await page.goto('/');
  const origin = new URL(page.url()).origin;
  const away: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(origin)) {
      away.push(request.url());
    }
  });

  await ask(page, 'openQuote');
  await ask(page, 'overview');
  await ask(page, 'margin');

  expect(away).toEqual([]);
});

test('the look beat warns before it calls, then recomposes the whole product', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/look-default/);

  await prompt(page, 'look').click();
  await expect(conversation(page)).toContainText('reloads the page');

  await expect(page.locator('html')).toHaveClass(/look-aurora/, {
    timeout: 30_000,
  });
});
