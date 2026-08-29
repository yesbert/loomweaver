import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Neutral host chrome', () => {
  test('toggles dark mode from the theme switch', async ({ page }) => {
    const html = page.locator('html');

    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(html).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Light' }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('switches the interface language', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Language' })).toContainText(
      'English',
    );

    await page.getByRole('button', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Deutsch' }).click();

    await expect(page.getByRole('button', { name: 'Sprache' })).toContainText(
      'Deutsch',
    );
    await expect(
      page.getByRole('button', { name: 'Einstellungen' }),
    ).toBeVisible();
  });

  test('anchors an open listbox to its trigger and keeps it on screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 380 });
    await page.getByRole('button', { name: 'Language' }).click();

    const anchored = await page.evaluate(() => {
      const list = document.querySelector('[role="listbox"]');
      if (!list) {
        return null;
      }
      const rect = list.getBoundingClientRect();
      return {
        positionArea: getComputedStyle(list).getPropertyValue('position-area'),
        top: rect.top,
        bottom: rect.bottom,
        viewport: window.innerHeight,
      };
    });

    expect(anchored).not.toBeNull();
    expect(anchored?.positionArea).not.toBe('none');
    expect(anchored?.top).toBeGreaterThanOrEqual(0);
    expect(anchored?.bottom).toBeLessThanOrEqual(anchored?.viewport ?? 0);
  });

  test('navigates the language menu with the keyboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Language' }).click();

    await expect(page.getByRole('option', { name: 'English' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Deutsch' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sprache' })).toContainText(
      'Deutsch',
    );
  });

  test('escape closes the language menu and restores focus to the trigger', async ({
    page,
  }) => {
    const trigger = page.getByRole('button', { name: 'Language' });
    await trigger.click();
    await expect(page.getByRole('option', { name: 'Deutsch' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('skip link is the first tab stop and moves focus to the content', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();

    await skip.press('Enter');
    await expect(page.locator('#lw-main-content')).toBeFocused();
  });

  test('honors prefers-reduced-motion by collapsing transitions', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const duration = await page
      .getByRole('button', { name: 'Dark' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    const maxMs = Math.max(
      ...duration
        .split(',')
        .map((d) => Number.parseFloat(d) * (d.trimEnd().endsWith('ms') ? 1 : 1000)),
    );

    expect(maxMs).toBeLessThan(20);
  });
});
