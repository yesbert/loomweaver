import { expect, type Page, test } from '@playwright/test';

function contentTabs(page: Page) {
  return page.locator('[id="pane-strip:content:main"] [role="tab"]').allInnerTexts();
}

function row(page: Page, number: string) {
  return page.locator(`li[data-quote="${number}"] button`);
}

async function openQuotesWorkspace(page: Page): Promise<void> {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Activity bar' })
    .getByRole('button', { name: 'Quotes' })
    .click();
  await expect(page).toHaveURL(/\/quotes\/q-0005$/);
}

test('the quotes workspace opens showing the quote it names', async ({
  page,
}) => {
  await openQuotesWorkspace(page);

  await expect.poll(() => contentTabs(page)).toEqual(['Q-0005']);
  await expect(page.getByRole('tab', { name: 'Positions' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Customer' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Margin' })).toBeVisible();
  await expect(page.getByText('Customer no. K-1004')).toBeVisible();
});

test('the declared tab cannot be closed, and a reset restores the arrangement', async ({
  page,
}) => {
  await openQuotesWorkspace(page);
  await expect.poll(() => contentTabs(page)).toEqual(['Q-0005']);

  await row(page, 'Q-0007').dblclick();
  await expect.poll(() => contentTabs(page)).toEqual([
    'Q-0005',
    'Q-0007',
  ]);

  await page.getByRole('button', { name: 'Workspaces' }).click();
  await page.getByTestId('workspace-reset').click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();

  await expect.poll(() => contentTabs(page)).toEqual(['Q-0005']);
  await expect(page).toHaveURL(/\/quotes\/q-0005$/);
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

  await openQuotesWorkspace(page);

  expect(complaints.filter((text) => /workspace/i.test(text))).toEqual([]);
});

test('the rail carries the workspace under its own icon and switches to it', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('lw.shell.active-workspace', 'default'),
  );
  await page.goto('/');

  const entry = page
    .getByRole('navigation', { name: 'Activity bar' })
    .getByRole('button', { name: 'Quotes' });
  await expect(entry).not.toHaveAttribute('aria-current', 'true');
  await expect(entry.locator('svg')).toHaveCount(1);
  await expect(entry.locator('.lw-rail-initials')).toHaveCount(0);

  await entry.click();

  await expect(page).toHaveURL(/\/quotes\/q-0005$/);
  await expect(entry).toHaveAttribute('aria-current', 'true');
});
