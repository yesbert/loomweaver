import { expect, test } from '@playwright/test';

test.describe('Hidden sidebar views', () => {
  const left = '#panel-views-left-panel';
  const right = '#panel-views-right-panel';

  test('hide via the view-tab menu, reveal from the customise dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();

    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Hide' }).click();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Navigator' }),
    ).toBeVisible();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);

    await page
      .locator(left)
      .click({ button: 'right', position: { x: 180, y: 24 } });
    await page.getByRole('menuitem', { name: 'Customize views' }).click();
    await expect(
      page.getByRole('button', { name: 'Navigator: Left' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('button', { name: 'Outline: Hidden' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Outline: Left' }).click();
    await page.keyboard.press('Escape');
    const tabs = page.locator(left).getByRole('tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(1)).toHaveAccessibleName('Outline');
  });

  test('the dialog shows where a moved view sits and sends it back', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).focus();
    await page.keyboard.press('Alt+Shift+ArrowRight');
    await expect(
      page.locator(right).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();

    await page
      .locator(left)
      .click({ button: 'right', position: { x: 180, y: 24 } });
    await page.getByRole('menuitem', { name: 'Customize views' }).click();
    await expect(
      page.getByRole('button', { name: 'Outline: Right' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Outline: Left' }).click();
    await page.keyboard.press('Escape');

    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    await expect(
      page.locator(right).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);
  });

  test('hiding flags the workspace as changed and reset restores the view', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Hide' }).click();
    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(1);
    await page.getByTestId('workspace-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();

    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await expect(page.getByTestId('workspace-changed')).toHaveCount(0);
  });
});
