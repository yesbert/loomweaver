import { expect, test } from '@playwright/test';
import { openEntry, runCommand } from './support/helpers';

test.describe('ctx.activeContent (finding #19)', () => {
  test('the plugin readout follows the focused surface and its params reactively', async ({
    page,
  }) => {
    await page.goto('/');
    const readout = page.getByTestId('testbed-active-content');
    await expect(readout).toHaveText('testbed.home');

    await page.getByRole('tab', { name: 'Entry list' }).click();
    await openEntry(page, 'E-01');
    await expect(readout).toHaveText(/testbed\.entry \(id=e-01\)/);

    await runCommand(page, 'Notes');
    await expect(readout).toHaveText('testbed.notes');

    await runCommand(page, 'Home');
    await expect(readout).toHaveText('testbed.home');
  });
});
