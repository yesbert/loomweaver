import { expect, test, type Locator } from '@playwright/test';
import { runCommand, startupNoticeGone } from './support/helpers';

const ENTERED_MS = 400;
const FADE_MS = 200;

async function centreOf(control: Locator): Promise<{ x: number; y: number }> {
  const box = await control.boundingBox();
  if (!box) {
    throw new Error('The control has no box to aim at.');
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

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
    const first = await centreOf(
      notices.getByRole('button', { name: 'Dismiss' }).first(),
    );
    await page.waitForTimeout(ENTERED_MS);

    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    await page.mouse.up();
    for (const shift of [1, 2, 3, 4, 5, 6]) {
      await page.waitForTimeout(FADE_MS / 6);
      await page.mouse.move(first.x - shift, first.y);
    }

    await expect(notices).toHaveCount(0, { timeout: 12_000 });
  });

  test('a pointer jumping from a notice onto one that is fading out does not keep the first', async ({
    page,
  }) => {
    await runCommand(page, 'Raise a notice with its own symbol');
    await runCommand(page, 'Raise the same warning again');
    const notices = page.getByRole('region', { name: 'Notifications' });
    const dismiss = notices.getByRole('button', { name: 'Dismiss' });
    const first = await centreOf(dismiss.first());
    const second = await centreOf(dismiss.last());
    await page.waitForTimeout(ENTERED_MS);

    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.move(second.x, second.y);
    await page.mouse.move(first.x, first.y);

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
