import { expect, test } from '@playwright/test';

test.describe('Panel splitter', () => {
  test('drag resizes the panel and the width survives a reload', async ({
    page,
  }) => {
    await page.goto('/');
    const separator = page
      .getByRole('separator', { name: 'Resize panel' })
      .first();
    await expect(separator).toBeVisible();

    const aside = page.locator('aside:has([role="separator"])').first();
    const before = (await aside.boundingBox())!.width;

    const box = (await separator.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();

    const after = (await aside.boundingBox())!.width;
    expect(after).toBeGreaterThan(before + 40);

    await page.reload();
    const restored = (await page
      .locator('aside:has([role="separator"])')
      .first()
      .boundingBox())!.width;
    expect(Math.abs(restored - after)).toBeLessThan(4);
  });

  test('arrow keys resize; End/Home jump to the max/min bound', async ({
    page,
  }) => {
    await page.goto('/');
    const separator = page
      .getByRole('separator', { name: 'Resize panel' })
      .first();
    await separator.focus();

    await expect(separator).toHaveAttribute('aria-valuenow', '256');

    await separator.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', '272');

    await separator.press('End');
    await expect(separator).toHaveAttribute('aria-valuenow', '480');
    await separator.press('Home');
    await expect(separator).toHaveAttribute('aria-valuenow', '180');
  });
});
