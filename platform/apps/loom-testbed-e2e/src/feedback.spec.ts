import { expect, test } from '@playwright/test';

test.describe('Feedback primitives', () => {
  test('renders the progress bar, ring and badges on the home view', async ({
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
