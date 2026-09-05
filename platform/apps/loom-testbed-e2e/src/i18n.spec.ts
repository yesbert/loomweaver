import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

test.describe('Translation overrides — the product rewords the shell', () => {
  test('the named key wins and its untouched siblings stay shipped', async ({
    page,
  }) => {
    await page.goto('/');

    await rail(page).click({ button: 'right', position: { x: 20, y: 480 } });

    await expect(
      page.getByRole('menuitem', { name: 'Choose the entries' }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Customize activity bar' }),
    ).toHaveCount(0);

    await expect(
      page.getByRole('link', { name: 'Skip to main content' }),
    ).toBeAttached();
  });

  test('merges inside a group, so an unnamed sibling of the renamed key survives', async ({
    page,
  }) => {
    await page.goto('/');

    await rail(page)
      .getByRole('button', { name: 'Sandbox (iframe)' })
      .click({ button: 'right' });

    await expect(
      page.getByRole('menuitem', { name: 'Move to other activity bar' }),
    ).toBeVisible();
  });

  test('a shipped string the product left alone still names the rail', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('navigation', { name: 'Left activity bar', exact: true }),
    ).toBeAttached();
    await expect(
      page.getByRole('navigation', { name: 'Right activity bar', exact: true }),
    ).toBeAttached();
  });
});
