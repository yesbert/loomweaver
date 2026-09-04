import { expect, test } from '@playwright/test';

test.describe('Persisted view state', () => {
  const left = '#panel-views-left-panel';

  test('the outline sort choice is saved and restored across a reload', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    const sortButton = page.getByTestId('outline-sort');
    await expect(sortButton).toHaveText(/outline order/);
    await expect(page.locator('ol li').first()).toContainText('Row C');

    await sortButton.click();
    await expect(sortButton).toHaveText(/A–Z/);
    await expect(page.locator('ol li').first()).toContainText('Row A');

    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('lw.shell.view-state:testbed.outline'),
        ),
      )
      .toContain('alpha');
    await page.reload();
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    await expect(page.getByTestId('outline-sort')).toHaveText(/A–Z/);
    await expect(page.locator('ol li').first()).toContainText('Row A');
  });

  test('"Reset view" clears the instance state back to defaults', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    const sortButton = page.getByTestId('outline-sort');
    await sortButton.click();
    await expect(sortButton).toHaveText(/A–Z/);
    await expect
      .poll(() =>
        page.evaluate(() =>
          localStorage.getItem('lw.shell.view-state:testbed.outline'),
        ),
      )
      .toContain('alpha');

    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menu').getByText('Reset view').click();

    await expect(sortButton).toHaveText(/outline order/);
    await expect(page.locator('ol li').first()).toContainText('Row C');

    await page.reload();
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await expect(page.getByTestId('outline-sort')).toHaveText(/outline order/);
  });
});
