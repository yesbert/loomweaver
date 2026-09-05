import { expect, test } from '@playwright/test';
import { rail } from './support/helpers';

test.describe('Rail entries the user curates', () => {
  test('hiding an entry from its own menu survives a reload, and the dialog brings it back', async ({
    page,
  }) => {
    await page.goto('/');
    const notes = rail(page).getByRole('button', {
      name: 'Notes',
      exact: true,
    });
    await expect(notes).toHaveCount(1);

    await notes.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Hide', exact: true }).click();
    await expect(notes).toHaveCount(0);

    await page.reload();
    await expect(notes).toHaveCount(0);

    await rail(page).click({ button: 'right', position: { x: 20, y: 480 } });
    await page
      .getByRole('menuitem', { name: 'Choose the entries' })
      .click();
    await page.getByRole('button', { name: 'Notes: Left' }).click();
    await page.keyboard.press('Escape');

    await expect(notes).toHaveCount(1);
  });

  test('an entry moves to the other rail with the keyboard and stays there', async ({
    page,
  }) => {
    await page.goto('/');
    const notes = rail(page).getByRole('button', {
      name: 'Notes',
      exact: true,
    });
    const right = page.getByRole('navigation', { name: 'Right activity bar' });
    await expect(notes).toHaveCount(1);

    await notes.focus();
    await page.keyboard.press('Alt+Shift+ArrowRight');

    await expect(notes).toHaveCount(0);
    await expect(
      right.getByRole('button', { name: 'Notes', exact: true }),
    ).toHaveCount(1);

    await page.reload();
    await expect(notes).toHaveCount(0);
    await expect(
      right.getByRole('button', { name: 'Notes', exact: true }),
    ).toHaveCount(1);
  });

  test('the entry menu offers the other rail', async ({ page }) => {
    await page.goto('/');
    const notes = rail(page).getByRole('button', {
      name: 'Notes',
      exact: true,
    });
    const right = page.getByRole('navigation', { name: 'Right activity bar' });

    await notes.click({ button: 'right' });
    await page
      .getByRole('menuitem', { name: 'Move to other activity bar' })
      .click();

    await expect(notes).toHaveCount(0);
    await expect(
      right.getByRole('button', { name: 'Notes', exact: true }),
    ).toHaveCount(1);
  });

  test('a saved workspace becomes a rail entry once it is checked, and switches from there', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Workspaces' }).click();
    await page.getByPlaceholder('Workspace name').fill('Quarter close');
    await page.getByTestId('workspace-save').click();
    await page.keyboard.press('Escape');

    const entry = rail(page).getByRole('button', {
      name: 'Quarter close',
      exact: true,
    });
    await expect(entry).toHaveCount(0);

    await rail(page).click({ button: 'right', position: { x: 20, y: 480 } });
    await page
      .getByRole('menuitem', { name: 'Choose the entries' })
      .click();
    await page.getByRole('button', { name: 'Quarter close: Left' }).click();
    await page.keyboard.press('Escape');

    await expect(entry).toHaveCount(1);
    await expect(entry).toHaveAttribute('aria-current', 'true');

    await rail(page)
      .getByRole('button', { name: 'Review', exact: true })
      .click();
    await expect(entry).not.toHaveAttribute('aria-current', 'true');

    await entry.click();
    await expect(entry).toHaveAttribute('aria-current', 'true');
  });
});
