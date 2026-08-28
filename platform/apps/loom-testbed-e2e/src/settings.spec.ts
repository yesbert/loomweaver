import { expect, test } from '@playwright/test';

test.describe('Settings surface', () => {
  test('the select control uses the <lw-select> WC and saves a choice', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('lw-settings-dialog')).toBeVisible();

    await page
      .getByRole('button', { name: 'Testbed weaver', exact: true })
      .click();

    await expect(page.locator('lw-settings-dialog select')).toHaveCount(0);

    const density = page.getByRole('button', { name: 'Density' });
    await expect(density).toContainText('Comfortable');
    await density.click();
    await page.getByRole('option', { name: 'Compact' }).click();
    await expect(density).toContainText('Compact');
  });

  test('the toggle, text and slider controls render and save (WC tranche 1/3)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page
      .getByRole('button', { name: 'Testbed weaver', exact: true })
      .click();

    const notifications = page.getByRole('switch', { name: 'Notifications' });
    await expect(notifications).toBeChecked();
    await notifications.click();
    await expect(notifications).not.toBeChecked();

    const displayName = page.getByRole('textbox', { name: 'Display name' });
    await expect(displayName).toHaveValue('Ada Lovelace');
    await displayName.fill('Grace Hopper');
    await expect(displayName).toHaveValue('Grace Hopper');

    const fontSize = page.getByRole('slider', { name: 'Font size' });
    await expect(fontSize).toHaveValue('14');
    await fontSize.fill('18');
    await expect(fontSize).toHaveValue('18');
    await expect(page.getByText('18', { exact: true })).toBeVisible();
  });

  test('the shell text-size setting scales the interface and persists across reload', async ({
    page,
  }) => {
    const rootFontSize = () =>
      page.evaluate(() => document.documentElement.style.fontSize);

    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('lw-settings-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'General', exact: true }).click();

    await page.getByRole('button', { name: 'Large', exact: true }).click();
    await expect.poll(rootFontSize).toBe('112.5%');

    await page.reload();
    await expect.poll(rootFontSize).toBe('112.5%');
  });

  test('the text-size setting reaches a sandboxed plugin surface', async ({
    page,
  }) => {
    const surface = () =>
      page.frames().find((f) => f.url().includes('view.html'));
    const surfaceRoot = async () =>
      surface()?.evaluate(
        () => getComputedStyle(document.documentElement).fontSize,
      ) ?? 'no-surface';
    const hostRoot = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).fontSize);

    await page.goto('/sandbox-rpc');
    await expect.poll(() => surface()?.url() ?? '').toContain('view.html');
    const host = await hostRoot();
    await expect.poll(surfaceRoot).toBe(host);

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('lw-settings-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'General', exact: true }).click();
    await page
      .getByRole('button', { name: 'Extra large', exact: true })
      .click();

    await expect.poll(hostRoot).toBe('20px');
    await expect.poll(surfaceRoot).toBe('20px');
  });
});
