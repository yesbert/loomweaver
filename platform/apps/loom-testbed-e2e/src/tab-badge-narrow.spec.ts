import { expect, test } from '@playwright/test';

const exportTab =
  'lw-address-pane-header lw-pane-tab-strip [role="tab"][data-tab-path="dashboard/export"]';

test.describe('A narrow tab keeps its title before its badge', () => {
  test('the badge narrows to a mark before the title is shortened', async ({
    page,
  }) => {
    await page.goto('/dashboard/export');
    const tab = page.locator(exportTab);
    await expect(tab.getByTestId('tab-badge')).toBeVisible();

    await tab.evaluate((element) => {
      const frame = element.parentElement as HTMLElement;
      frame.style.minWidth = '130px';
      frame.style.maxWidth = '130px';
    });

    const measured = await tab.evaluate((element) => {
      const badge = element.querySelector<HTMLElement>(
        '[data-testid="tab-badge"]',
      );
      const title = badge?.previousElementSibling as HTMLElement | null;
      const text = badge?.querySelector('span');
      const cut = (element: Element | null | undefined) =>
        (element?.scrollWidth ?? 0) > (element?.clientWidth ?? 0) + 1;
      return {
        titleCut: cut(title),
        badgeCut: cut(text),
        badgeWidth: badge?.getBoundingClientRect().width ?? 0,
      };
    });

    expect(measured.titleCut).toBe(false);
    expect(measured.badgeCut).toBe(true);
    expect(measured.badgeWidth).toBeGreaterThan(0);
  });

  test('the tooltip carries the title and the badge', async ({ page }) => {
    await page.goto('/dashboard/export');

    await expect(page.locator(`${exportTab} lw-tooltip`)).toHaveAttribute(
      'text',
      'Export, New',
    );
  });
});
