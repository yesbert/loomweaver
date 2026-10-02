import { expect, test } from '@playwright/test';

test.describe('Feedback primitives', () => {
  test('renders the progress bar, ring, spinner and badges on the home view', async ({
    page,
  }) => {
    await page.goto('/');
    const card = page.getByTestId('testbed-feedback-card');
    await expect(card).toBeVisible();

    await expect(card.locator('progress.lw-progress')).toBeVisible();

    const ring = card.locator('lw-progress-ring');
    await expect(ring).toBeVisible();
    await expect(ring).toHaveAttribute('role', 'progressbar');
    await expect(ring).toHaveAttribute('aria-valuenow', '72');
    await expect(ring).toContainText('72%');

    const spinner = card.locator('lw-spinner .lw-spinner-ring');
    await expect(spinner).toBeVisible();
    await expect(spinner).toHaveAttribute('role', 'status');
    await expect(spinner).toHaveAttribute('aria-label', 'live');
    await expect(spinner).toHaveCSS('width', '32px');
    await expect(spinner).toHaveCSS('animation-name', 'spin');

    const colours = await page.evaluate(() => {
      const brand = getComputedStyle(
        document.querySelector('lw-spinner .lw-spinner-ring') as Element,
      ).borderLeftColor;
      const host = document.createElement('p');
      host.style.color = 'rgb(1, 2, 3)';
      const ring = document.createElement('span');
      ring.className = 'lw-spinner-ring';
      host.append(ring);
      document.body.append(host);
      const byHand = getComputedStyle(ring).borderLeftColor;
      host.remove();
      return { brand, byHand };
    });
    expect(colours.byHand).toBe('rgb(1, 2, 3)');
    expect(colours.brand).not.toBe('rgb(1, 2, 3)');

    await expect(card.locator('.lw-badge.lw-badge--brand')).toHaveText('live');
    await expect(card.locator('.lw-badge.lw-badge--success')).toHaveText(
      '2 resolved',
    );
  });

  test('the container primitives divider + collapsible work (WC tranche ④)', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('hr.lw-divider')).toBeVisible();

    const body = page.locator('.lw-collapsible-body');
    await expect(body).toBeHidden();
    await page.getByText('What is under test here').click();
    await expect(body).toBeVisible();
    await page.getByText('What is under test here').click();
    await expect(body).toBeHidden();
  });
});
