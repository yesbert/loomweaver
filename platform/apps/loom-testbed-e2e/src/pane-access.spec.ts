import { expect, test } from '@playwright/test';
import { railRight } from './support/helpers';

test.describe('A pane says why it is empty', () => {
  test('a gated container child keeps its pane and shows the access placeholder until the role arrives', async ({
    page,
  }) => {
    await page.goto('/arranged/alpha');

    const host = page.locator('lw-container-pane-host');
    await expect(host.locator('lw-pane-view')).toHaveCount(4);
    await expect(
      host.getByRole('tab', { name: 'Audit (admin)' }),
    ).toBeVisible();

    const placeholder = host.getByTestId('access-placeholder');
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText('Sign-in required');
    await expect(host.getByTestId('testbed-ws-audit')).toHaveCount(0);

    const cycle = railRight(page).getByRole('button', { name: 'Switch user' });
    await cycle.click();
    await expect(placeholder).toContainText('No access');
    await expect(host.getByTestId('testbed-ws-audit')).toHaveCount(0);

    await cycle.click();
    await expect(host.getByTestId('testbed-ws-audit')).toBeVisible();
    await expect(host.getByTestId('access-placeholder')).toHaveCount(0);
  });
});
