import { expect, test } from '@playwright/test';
import { runCommand, startupNoticeGone } from './support/helpers';

test.describe('Notices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await startupNoticeGone(page);
  });

  test('a notice the pointer moved onto stays, and leaves soon after the pointer has left', async ({
    page,
  }) => {
    await runCommand(page, 'Raise a notice with its own symbol');
    const notice = page.getByText('A success shown with a pin');
    await expect(notice).toBeVisible();

    await notice.hover();
    await page.waitForTimeout(6500);
    await expect(notice).toBeVisible();

    await page.mouse.move(0, 0);
    await expect(notice).toHaveCount(0, { timeout: 8000 });
  });

  test('a notice keyboard focus is in stays', async ({ page }) => {
    await runCommand(page, 'Raise a notice with its own symbol');
    const notices = page.getByRole('region', { name: 'Notifications' });
    await expect(notices).toBeVisible();

    await notices.getByRole('button', { name: 'Dismiss' }).focus();
    await page.waitForTimeout(6500);
    await expect(notices).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(notices).toHaveCount(0);
  });

  test('dismissing one notice by pointer lets the others leave', async ({
    page,
  }) => {
    await runCommand(page, 'Raise a notice with its own symbol');
    await runCommand(page, 'Raise the same warning again');
    const notices = page.getByRole('region', { name: 'Notifications' });
    await expect(notices.getByRole('button', { name: 'Dismiss' })).toHaveCount(
      2,
    );

    await notices.getByRole('button', { name: 'Dismiss' }).first().click();

    await expect(notices).toHaveCount(0, { timeout: 12_000 });
  });

  test('a pointer still moving on a notice that is fading out does not keep the others', async ({
    page,
  }) => {
    await runCommand(page, 'Raise a notice with its own symbol');
    await runCommand(page, 'Raise the same warning again');
    const notices = page.getByRole('region', { name: 'Notifications' });
    const dismiss = notices.getByRole('button', { name: 'Dismiss' }).first();
    const box = await dismiss.boundingBox();
    if (!box) {
      throw new Error('The dismiss control has no box to click.');
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(60);
    await page.mouse.move(x - 2, y);

    await expect(notices).toHaveCount(0, { timeout: 12_000 });
  });

  test('focus passing through a notice under a resting pointer does not keep it', async ({
    page,
  }) => {
    await page.mouse.move(1500, 855);
    await page.keyboard.press('ControlOrMeta+k');
    await page
      .getByRole('combobox', { name: 'Command palette' })
      .fill('Raise a notice with its own symbol');
    await page.keyboard.press('Enter');
    const notices = page.getByRole('region', { name: 'Notifications' });
    const dismiss = notices.getByRole('button', { name: 'Dismiss' });
    await expect(dismiss).toBeVisible();

    await dismiss.focus();
    await dismiss.blur();

    await expect(notices).toHaveCount(0, { timeout: 8000 });
  });

  test('a burst shows three notices and brings the others up as room is made', async ({
    page,
  }) => {
    await runCommand(page, 'Raise five notices at once');
    const notices = page.getByRole('region', { name: 'Notifications' });
    await expect(notices.getByRole('status')).toHaveCount(3);
    await expect(notices.getByText('notice 4 of 5')).toHaveCount(0);

    await notices.getByRole('button', { name: 'Dismiss' }).first().click();
    await expect(notices.getByText('notice 4 of 5')).toBeVisible();
  });
});
