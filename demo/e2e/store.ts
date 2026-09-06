import { expect, type Page } from '@playwright/test';

export async function installPaymentMatching(page: Page): Promise<void> {
  await page.locator('[data-rail-item="demo.pluginStore"]').click();
  const store = page.getByRole('dialog').first();
  await store.getByTestId('store-card-payments').click();
  await expect(
    store.getByRole('heading', { name: 'Payment matching' }).first(),
  ).toBeVisible();
  const install = store.getByRole('button', { name: /^Install$/ });
  await install.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await install.isVisible()) {
    await install.click();
    const consent = page.getByRole('dialog', { name: /^Install .*\?$/ });
    await consent.getByRole('button', { name: 'Install', exact: true }).click();
    await expect(consent).toHaveCount(0);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
