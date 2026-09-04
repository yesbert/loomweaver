import { expect, test } from '@playwright/test';

test.describe('Developer-defined workspaces', () => {
  const openReview = async (page: import('@playwright/test').Page) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByTestId('workspace-tab-provided').click();
    await page.getByTestId('workspace-def-testbed.review').click();
    await expect(page).toHaveURL(/entry\/e-01/);
  };

  test('switching applies the declared arrangement and it survives a reload', async ({
    page,
  }) => {
    await openReview(page);

    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(2);
    await expect(
      page.locator('lw-content-secondary-pane').filter({ hasText: 'Search' }),
    ).toBeVisible();
    await expect(
      page.locator('lw-content-secondary-pane').filter({ hasText: 'Notes' }),
    ).toBeVisible();

    const leftTabs = page.locator('#panel-views-left-panel').getByRole('tab');
    await expect(leftTabs).toHaveCount(1);
    await expect(leftTabs.first()).toHaveAccessibleName('Navigator');
    await expect(page.locator('#panel-views-right-panel')).toHaveCount(1);

    await page.reload();
    await expect(page).toHaveURL(/entry\/e-01/);
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(2);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(
      page.getByTestId('workspace-def-testbed.review'),
    ).toContainText('Review');
    await expect(page.getByTestId('workspace-changed')).toHaveCount(0);
  });

  test('the declared tab is unclosable and close all spares it', async ({
    page,
  }) => {
    await openReview(page);
    await expect(page.getByRole('tab', { name: 'E-01' })).toBeVisible();

    await page.goto('/entry/e-02');
    const declared = page.getByRole('tab', { name: 'E-01' });
    const opened = page.getByRole('tab', { name: 'E-02' });
    await expect(declared).toBeVisible();
    await expect(opened).toBeVisible();
    await expect(declared.locator('..').getByTestId('tab-close')).toHaveCount(
      0,
    );
    await expect(opened.locator('..').getByTestId('tab-close')).toHaveCount(1);

    await opened.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Close all' }).click();
    await expect(declared).toBeVisible();
    await expect(page.getByRole('tab', { name: 'E-02' })).toHaveCount(0);
  });

  test('rearranging flags the workspace and reset restores the declaration', async ({
    page,
  }) => {
    await openReview(page);

    await page
      .locator('lw-pane-view')
      .filter({ hasText: 'Notes' })
      .last()
      .getByRole('button', { name: 'Close pane' })
      .click();
    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(1);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(1);
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();

    await expect(page.locator('lw-content-secondary-pane')).toHaveCount(2);
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(0);
  });
});
