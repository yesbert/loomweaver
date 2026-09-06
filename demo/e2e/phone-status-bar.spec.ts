import { expect, type Locator, test } from '@playwright/test';

const PHONE = { width: 390, height: 844 };

async function boxesOf(bar: Locator) {
  return bar.locator('[data-bar-entry], [data-bar-fold]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }),
  );
}

test('on a phone the status bar folds what does not fit, and nothing overlaps or is cut off', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await page.goto('/sales/customers');

  const statusBar = page.locator('lw-shell-bar').last();
  await expect(statusBar.locator('[data-bar-fold]')).toBeVisible();

  const boxes = await boxesOf(statusBar);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(PHONE.width);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const overlap = boxes[i].left < boxes[j].right - 1 && boxes[j].left < boxes[i].right - 1;
      expect(overlap, `entries ${i} and ${j} overlap`).toBe(false);
    }
  }
});

test('a folded entry is reachable through the fold control: the legal link is offered in the tray', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await page.goto('/sales/customers');

  const statusBar = page.locator('lw-shell-bar').last();
  await expect(statusBar).not.toContainText('Legal notice');

  await statusBar.getByRole('button', { name: 'More' }).click();
  const tray = page.getByRole('group', { name: 'More' });
  await expect(tray).toContainText('Legal notice');

  const link = tray.getByRole('link', { name: 'Legal notice' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://loomweaver.dev/imprint/');
});

test('a wide window shows every status bar entry and no fold control', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/sales/customers');

  const statusBar = page.locator('lw-shell-bar').last();
  await expect(statusBar).toContainText('Legal notice');
  await expect(statusBar.locator('[data-bar-fold]')).toHaveCount(0);
});
