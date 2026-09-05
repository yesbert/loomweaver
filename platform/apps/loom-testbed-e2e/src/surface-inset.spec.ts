import { expect, test, type Page } from '@playwright/test';

const leftPanelTabs = '#panel-views-left-panel';

async function insetOfDockedView(page: Page): Promise<string> {
  return page.evaluate(() => {
    const docked = [
      ...document.querySelectorAll<HTMLElement>('[class*="container/surface"]'),
    ].find((surface) => surface.getBoundingClientRect().left < 500);
    return docked ? getComputedStyle(docked).padding : 'no docked surface';
  });
}

test.describe('The inset a sidebar gives a view', () => {
  test('is none for a view that owns its edges', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Item C', { exact: true })).toBeVisible();

    expect(await insetOfDockedView(page)).toBe('0px');
  });

  test('is applied for a view that asks for it', async ({ page }) => {
    await page.goto('/');
    await page.locator(leftPanelTabs).getByRole('tab', { name: 'Outline' }).click();
    await page.waitForTimeout(300);

    expect(await insetOfDockedView(page)).not.toBe('0px');
  });
});
