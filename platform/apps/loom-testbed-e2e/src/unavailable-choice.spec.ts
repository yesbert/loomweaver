import { expect, test, Locator, Page } from '@playwright/test';

async function openInfo(page: Page): Promise<Locator> {
  await page.goto('/');
  await page
    .locator('#panel-views-right-panel')
    .getByRole('tab', { name: 'Info' })
    .click();
  return page.getByTestId('testbed-availability');
}

function look(control: Locator) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, cursor: style.cursor };
  });
}

test.describe('A choice that is unavailable but must stay reachable', () => {
  test('looks like the natively disabled control', async ({ page }) => {
    const availability = await openInfo(page);
    const disabled = await look(
      availability.getByRole('switch', { name: 'Work offline' }),
    );

    for (const control of [
      availability.getByRole('switch', { name: 'Sync with the server' }),
      availability.getByRole('checkbox', { name: 'Archive this entry' }),
      availability.getByRole('radio', { name: 'Escalate' }),
    ]) {
      expect(await look(control)).toEqual(disabled);
    }
  });

  test('stays in the tab order and carries its reason', async ({ page }) => {
    const availability = await openInfo(page);
    const sync = availability.getByRole('switch', {
      name: 'Sync with the server',
    });

    await sync.focus();

    await expect(sync).toBeFocused();
    await expect(sync).toHaveAccessibleDescription(
      'Needs a connection to the server.',
    );
    await page.keyboard.press('Space');
    await expect(sync).not.toBeChecked();
  });
});
