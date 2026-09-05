import { expect, type Page, test } from '@playwright/test';

function contentTabs(page: Page) {
  return page.locator('[id="pane-strip:content:main"] [role="tab"]').allInnerTexts();
}

function navEntry(page: Page, path: string) {
  return page.locator(`[data-nav-view="${path}"]`);
}

async function openSales(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Activity bar' })
    .getByRole('button', { name: 'Sales' })
    .click();
  await expect(page).toHaveURL(/\/sales\/customers$/);
}

test('the sales workspace opens showing the view it names', async ({ page }) => {
  await openSales(page);

  await expect.poll(() => contentTabs(page)).toEqual(['Customer list']);
  await expect(page.getByTestId('customer-list')).toBeVisible();
  await expect(navEntry(page, 'sales/customers')).toHaveAttribute('aria-current', 'page');
});

/* The declared tab is the workspace's own, so the workbench gives it no close control, and a reset
   takes the arrangement back to it however far the visitor has browsed. */
test('the declared tab cannot be closed, and a reset restores the arrangement', async ({
  page,
}) => {
  await openSales(page);

  const landing = page.locator(
    '[id="pane-strip:content:main"] [data-tab-path="sales/customers"]',
  );
  await expect(landing.locator('[data-testid="tab-close"]')).toHaveCount(0);

  await navEntry(page, 'sales/contacts').click();
  await expect.poll(() => contentTabs(page)).toEqual(['Customer list', 'Contact history']);

  await page.getByRole('button', { name: 'Workspaces' }).click();
  await page.getByTestId('workspace-reset').click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();

  await expect.poll(() => contentTabs(page)).toEqual(['Customer list']);
  await expect(page).toHaveURL(/\/sales\/customers$/);
});

/* The point of the modules: each keeps its own tabs, so leaving one and coming back finds the work
   as it was left. A menu tree cannot do this, because it has nothing to come back to. */
test('a module returned to still holds what was open in it', async ({ page }) => {
  await openSales(page);

  await navEntry(page, 'sales/quotes').click();
  await page.locator('li[data-quote="Q-0007"] button').click();
  await expect(page).toHaveURL(/\/sales\/quotes\/q-0007$/);
  await expect
    .poll(() => contentTabs(page))
    .toEqual(['Customer list', 'Quotes', 'Q-0007']);

  const rail = page.getByRole('navigation', { name: 'Activity bar' });
  await rail.getByRole('button', { name: 'Finance' }).click();
  await expect(page).toHaveURL(/\/finance\/matching$/);
  await expect.poll(() => contentTabs(page)).toEqual(['Payment matching']);

  await rail.getByRole('button', { name: 'Sales' }).click();

  await expect(page).toHaveURL(/\/sales\/quotes\/q-0007$/);
  await expect
    .poll(() => contentTabs(page))
    .toEqual(['Customer list', 'Quotes', 'Q-0007']);
});

test('the declaration is one the workbench can use, so it reports nothing', async ({
  page,
}) => {
  const complaints: string[] = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      complaints.push(message.text());
    }
  });

  await openSales(page);

  expect(complaints.filter((text) => /workspace/i.test(text))).toEqual([]);
});

test('the rail carries the workspace under its own icon and switches to it', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('lw.shell.active-workspace', 'overview'),
  );
  await page.goto('/');

  const entry = page
    .getByRole('navigation', { name: 'Activity bar' })
    .getByRole('button', { name: 'Sales' });
  await expect(entry).not.toHaveAttribute('aria-current', 'true');
  await expect(entry.locator('svg')).toHaveCount(1);
  await expect(entry.locator('.lw-rail-initials')).toHaveCount(0);

  await entry.click();

  await expect(page).toHaveURL(/\/sales\/customers$/);
  await expect(entry).toHaveAttribute('aria-current', 'true');
});
