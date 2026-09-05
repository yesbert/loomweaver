import { expect, test } from '@playwright/test';
import { rail, railRight } from './support/helpers';

async function switchOn(
  page: import('@playwright/test').Page,
  name: string,
): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('lw-settings-dialog')).toBeVisible();
  const control = page.getByRole('switch', { name, exact: true });
  await expect(control).not.toBeChecked();
  await control.click();
  await expect(control).toBeChecked();
  await page.getByRole('dialog', { name: 'Settings' }).getByLabel('Close').click();
}

test.describe('Names in the rail', () => {
  test('a switch labels the rail it names and leaves the other alone', async ({
    page,
  }) => {
    await page.goto('/');

    await switchOn(page, 'Left activity bar');

    await expect(rail(page).getByTestId('rail-label').first()).toBeVisible();
    await expect(railRight(page).getByTestId('rail-label')).toHaveCount(0);
  });

  test('the choice survives a reload', async ({ page }) => {
    await page.goto('/');

    await switchOn(page, 'Left activity bar');
    await page.reload();

    await expect(rail(page).getByTestId('rail-label').first()).toBeVisible();
  });

  test('a readable name drops its tooltip and a shortened one keeps it', async ({
    page,
  }) => {
    await page.goto('/');

    await switchOn(page, 'Left activity bar');
    const labels = rail(page).getByTestId('rail-label');
    await expect(labels.first()).toBeVisible();

    const shortened = await labels.evaluateAll((elements) =>
      elements
        .filter((element) => element.scrollHeight - element.clientHeight > 1)
        .map((element) => element.dataset['railLabel']),
    );

    expect(shortened.length).toBeGreaterThan(0);
    await expect(rail(page).locator('lw-tooltip')).toHaveCount(
      shortened.length,
    );
  });

  test('a rail too full to fit scrolls, and its anchored band stays', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 460 });
    await page.goto('/');

    const band = rail(page).getByTestId('rail-scroll');
    const anchored = rail(page).getByTestId('rail-anchored');
    await expect(anchored).toBeVisible();

    const overflowing = await band.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    );
    expect(overflowing).toBe(true);

    const before = await anchored.boundingBox();
    await band.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight }),
    );
    const after = await anchored.boundingBox();

    expect(after?.y).toBe(before?.y);
    const lastVisible = await band.evaluate((element) => {
      const entries = [...element.querySelectorAll('[data-rail-item]')];
      const last = entries.at(-1);
      const box = last!.getBoundingClientRect();
      const frame = element.getBoundingClientRect();
      return box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1;
    });
    expect(lastVisible).toBe(true);
  });
});
