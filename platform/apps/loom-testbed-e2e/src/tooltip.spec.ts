import { expect, test } from '@playwright/test';

test.describe('<lw-tooltip>', () => {
  test('reveals the bubble on hover (JS-driven popover)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Entry list' }).click();

    const bubble = page
      .locator('lw-tooltip [role="tooltip"]')
      .filter({ hasText: 'Alpha' })
      .first();
    await expect(bubble).toBeHidden();

    await page.getByRole('button', { name: 'Alpha' }).hover();
    await expect(bubble).toBeVisible();
  });

  test('a tooltip inside a transform/overflow ancestor still shows in the top layer (#13)', async ({
    page,
  }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const box = document.createElement('div');
      box.id = 'clip-box';
      box.style.cssText =
        'position:fixed;top:200px;left:200px;width:60px;height:32px;overflow:hidden;transform:translateY(0);';
      const trigger = document.createElement('button');
      trigger.id = 'clip-trigger';
      trigger.style.cssText = 'position:relative;width:100%;height:100%;';
      const tip = document.createElement('lw-tooltip');
      tip.setAttribute('text', 'ESCAPES THE CLIP');
      tip.setAttribute('position', 'bottom');
      tip.setAttribute('delay-ms', '0');
      trigger.append(tip);
      box.append(trigger);
      document.body.append(box);
    });

    await page.locator('#clip-trigger').hover();
    const bubble = page.locator('#clip-box lw-tooltip [role="tooltip"]');
    await expect(bubble).toBeVisible();

    expect(await bubble.evaluate((element) => element.matches(':popover-open'))).toBe(
      true,
    );
  });
});
