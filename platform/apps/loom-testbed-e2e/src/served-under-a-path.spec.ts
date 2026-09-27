import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

const left = '#panel-views-left-panel';

test.describe('A distribution served under a path', () => {
  test('loads its strings from its own path, and none from the root', async ({
    page,
  }) => {
    const translations: string[] = [];
    page.on('request', (request) => {
      const { pathname } = new URL(request.url());
      if (pathname.includes('/i18n/')) {
        translations.push(pathname);
      }
    });

    await page.goto('./');

    await expect(
      page.locator(left).getByRole('tab', { name: 'Outline' }),
    ).toBeVisible();
    expect(translations).toContain('/x/i18n/en.json');
    expect(translations).toContain('/x/i18n/testbed/en.json');
    expect(translations.filter((path) => !path.startsWith('/x/'))).toEqual([]);
  });

  test('opens a pop-out of itself under its path', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('./');
    await page.locator(left).getByRole('tab', { name: 'Outline' }).click();

    const popup = context.waitForEvent('page');
    await page
      .locator(left)
      .getByRole('tab', { name: 'Outline' })
      .click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Open in new window' }).click();

    const opened = await popup;
    await opened.waitForLoadState();
    expect(new URL(opened.url()).pathname).toBe(
      '/x/popout/view/testbed.outline',
    );
    await expect(opened.getByTestId('popout-surface')).toBeVisible();
    await expect(rail(opened)).toHaveCount(0);
  });
});
