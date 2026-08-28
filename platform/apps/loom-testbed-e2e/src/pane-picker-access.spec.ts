import { expect, test } from '@playwright/test';
import { railRight } from './support/helpers';

test.describe('New-Tab pane picker honours the session', () => {
  test('withholds a gated route, offers it once the session qualifies, withdraws it live', async ({
    page,
  }) => {
    await page.goto('/');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });
    const newTab = page.getByTestId('content-new-tab');
    const secret = page.getByRole('menuitem', { name: 'Admin route' });
    const notes = page.getByRole('menuitem', { name: 'Notes' });

    await newTab.click();
    await expect(notes).toBeVisible();
    await expect(secret).toHaveCount(0);
    await page.keyboard.press('Escape');

    await cycle.click();
    await cycle.click();
    await newTab.click();
    await expect(secret).toBeVisible();
    await page.keyboard.press('Escape');

    await cycle.click();
    await newTab.click();
    await expect(notes).toBeVisible();
    await expect(secret).toHaveCount(0);
  });

  test('picking the gated route navigates there', async ({ page }) => {
    await page.goto('/');
    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });

    await cycle.click();
    await cycle.click();
    await page.getByTestId('content-new-tab').click();
    await page.getByRole('menuitem', { name: 'Admin route' }).click();

    await expect(page).toHaveURL(/\/secret$/);
  });
});
