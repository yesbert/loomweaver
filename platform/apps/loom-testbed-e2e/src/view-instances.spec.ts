import { expect, test } from '@playwright/test';

test.describe('Saved view instances', () => {
  const left = '#panel-views-left-panel';
  const switcher = () => 'view-switcher';

  test('create, switch, persist and delete a named saved view', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    await expect(page.getByTestId(switcher())).toContainText('Default');
    await expect(page.getByTestId('outline-sort')).toHaveText(/outline order/);

    await page.getByTestId(switcher()).click();
    await page
      .getByRole('menu')
      .getByText('New view', { exact: false })
      .click();
    await page.getByRole('dialog').getByRole('textbox').fill('Alpha');
    await page.getByRole('dialog').getByRole('textbox').press('Enter');

    await expect(page.getByTestId(switcher())).toContainText('Alpha');
    await expect(page.getByTestId('outline-sort')).toHaveText(/outline order/);

    await page.getByTestId('outline-sort').click();
    await expect(page.locator('ol li').first()).toContainText('Row A');

    await page.getByTestId(switcher()).click();
    await page.getByRole('menu').getByText('Default', { exact: true }).click();
    await expect(page.locator('ol li').first()).toContainText('Row C');

    await page.getByTestId(switcher()).click();
    await page.getByRole('menu').getByText('Alpha', { exact: true }).click();
    await expect(page.locator('ol li').first()).toContainText('Row A');

    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.entries(localStorage).some(
            ([key, value]) =>
              key.startsWith('lw.shell.view-state:') && value.includes('alpha'),
          ),
        ),
      )
      .toBe(true);
    await page.reload();
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await expect(page.getByTestId(switcher())).toContainText('Alpha');
    await expect(page.locator('ol li').first()).toContainText('Row A');

    await page.getByTestId(switcher()).click();
    await page.getByRole('menu').getByText('Delete', { exact: false }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId(switcher())).toContainText('Default');
    await expect(page.locator('ol li').first()).toContainText('Row C');
  });

  test('the switcher travels into a content pane, where it still switches instances (#27)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    await page.getByTestId(switcher()).click();
    await page
      .getByRole('menu')
      .getByText('New view', { exact: false })
      .click();
    await page.getByRole('dialog').getByRole('textbox').fill('Beta');
    await page.getByRole('dialog').getByRole('textbox').press('Enter');
    await page.getByTestId('outline-sort').click();

    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Open in content' }).click();

    const pane = page.locator('lw-content-secondary-pane');
    await expect(pane.locator('lw-testbed-outline-view')).toBeVisible();
    await expect(pane.getByTestId(switcher())).toContainText('Beta');

    await pane.getByTestId(switcher()).click();
    await page.getByRole('menu').getByText('Default', { exact: true }).click();
    await expect(pane.getByTestId(switcher())).toContainText('Default');
    await expect(pane.locator('ol li').first()).toContainText('Row C');
  });

  test('the switcher travels into a pop-out window (#27)', async ({ page }) => {
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();
    await page.getByTestId(switcher()).click();
    await page
      .getByRole('menu')
      .getByText('New view', { exact: false })
      .click();
    await page.getByRole('dialog').getByRole('textbox').fill('Gamma');
    await page.getByRole('dialog').getByRole('textbox').press('Enter');

    await page.goto('/popout/view/testbed.outline');
    await expect(page.getByTestId('popout-surface')).toBeVisible();
    await expect(page.getByTestId(switcher())).toContainText('Gamma');
  });
});
