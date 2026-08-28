import { expect, test } from '@playwright/test';

test.describe('Translation overrides — the product rewords the shell', () => {
  test('the named key wins and its untouched siblings stay shipped', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('navigation', { name: 'Toolbar', exact: true }),
    ).toBeAttached();
    await expect(
      page.getByRole('navigation', { name: 'Activity bar', exact: true }),
    ).toHaveCount(0);

    await expect(
      page.getByRole('link', { name: 'Skip to main content' }),
    ).toBeAttached();
  });

  test('merges inside a group, so an unnamed sibling of the renamed key survives', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByRole('navigation', { name: 'Toolbar' })
      .getByRole('button', { name: 'Sandbox (iframe)' })
      .click({ button: 'right' });

    await expect(
      page.getByRole('menuitem', { name: 'Move to other activity bar' }),
    ).toBeVisible();
  });
});
