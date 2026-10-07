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

  test('skip link below the root moves focus without loading the page again', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    await expect(page.locator('#lw-main-content textarea')).toBeVisible();
    let loads = 0;
    page.on('load', () => loads++);

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');

    await expect(page.locator('#lw-main-content')).toBeFocused();
    await expect(page).toHaveURL(/\/entry\/e-01$/);
    expect(loads).toBe(0);
  });

  test('skip link keeps unsaved work and asks nothing about leaving', async ({
    page,
  }) => {
    await page.goto('/entry/e-01');
    const draft = page.locator('#lw-main-content textarea');
    await draft.fill('UNSAVED-DRAFT');
    let loads = 0;
    let questions = 0;
    page.on('load', () => loads++);
    page.on('dialog', (dialog) => {
      questions++;
      void dialog.dismiss();
    });

    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await skip.focus();
    await skip.press('Enter');

    await expect(page.locator('#lw-main-content')).toBeFocused();
    await expect(draft).toHaveValue('UNSAVED-DRAFT');
    expect(loads).toBe(0);
    expect(questions).toBe(0);
  });

  test('honors prefers-reduced-motion by collapsing transitions', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const duration = await page
      .getByRole('button', { name: 'Dark' })
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    const maxMs = Math.max(
      ...duration
        .split(',')
        .map(
          (d) => Number.parseFloat(d) * (d.trimEnd().endsWith('ms') ? 1 : 1000),
        ),
    );

    expect(maxMs).toBeLessThan(20);
  });
});
